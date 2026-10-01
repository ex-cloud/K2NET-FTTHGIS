package com.company.ftthgis.service.organization;

import com.company.ftthgis.api.tenant.dto.OrganizationCreateRequest;
import com.company.ftthgis.config.tenant.KeycloakService;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationConfig;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.repository.OrganizationConfigRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSlugAliasRepository;
import com.company.ftthgis.domain.tenant.repository.SubscriptionPlanRepository;
import com.company.ftthgis.domain.user.entity.Role;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.RoleRepository;
import com.company.ftthgis.service.AuditLoggingService;
import com.company.ftthgis.service.FileStorageService;
import com.company.ftthgis.util.EncryptionUtils;
import com.company.ftthgis.util.RandomSlugGenerator;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationProvisioningService {

    private final OrganizationRepository organizationRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final OrganizationSlugAliasRepository organizationSlugAliasRepository;
    private final RandomSlugGenerator randomSlugGenerator;
    private final OrganizationConfigRepository organizationConfigRepository;
    private final EncryptionUtils encryptionUtils;
    private final KeycloakService keycloakService;
    private final RoleRepository roleRepository;
    private final EntityManager entityManager;
    private final FileStorageService fileStorageService;
    private final AuditLoggingService auditLoggingService;

    @Transactional
    public Map<String, Object> createOrganization(OrganizationCreateRequest request) {
        // Lookup Subscription Plan
        String rawPlan = request.getPlan() != null ? request.getPlan().trim() : "FREE";
        String normalizedPlan = OrganizationQuotaService.normalizePlanName(rawPlan);

        final String targetPlanName = normalizedPlan;
        SubscriptionPlan plan = subscriptionPlanRepository
                .findByName(targetPlanName)
                .orElseGet(() -> subscriptionPlanRepository.findByName("FREE").orElse(null));

        String finalSlug;
        String slugType;
        if ("FREE".equalsIgnoreCase(targetPlanName)) {
            String candidateSlug = request.getSlug() != null ? request.getSlug().trim().toLowerCase() : "";
            if (candidateSlug.matches("^[a-z]{20}$") && !randomSlugGenerator.isReserved(candidateSlug)
                    && !organizationRepository.existsBySlug(candidateSlug)
                    && (organizationSlugAliasRepository == null || !organizationSlugAliasRepository.existsByOldSlug(candidateSlug))) {
                finalSlug = candidateSlug;
            } else {
                finalSlug = randomSlugGenerator.generateUniqueSlug(organizationRepository, organizationSlugAliasRepository);
            }
            slugType = "RANDOM";
            log.info("🎲 Assigned 20-char random slug '{}' for organization '{}'", finalSlug, request.getName());
        } else if (request.getSlug() == null || request.getSlug().trim().isBlank()) {
            finalSlug = randomSlugGenerator.generateUniqueSlug(organizationRepository, organizationSlugAliasRepository);
            slugType = "RANDOM";
            log.info("🎲 Auto-assigned 20-char random slug '{}' for organization '{}'", finalSlug, request.getName());
        } else {
            finalSlug = request.getSlug().trim().toLowerCase();
            if (randomSlugGenerator.isReserved(finalSlug)) {
                throw new IllegalArgumentException("Subdomain slug '" + finalSlug + "' is a reserved platform keyword.");
            }
            if (!randomSlugGenerator.isValidCustomSlug(finalSlug)) {
                throw new IllegalArgumentException("Invalid subdomain slug format: '" + finalSlug + "'");
            }
            if (organizationRepository.existsBySlug(finalSlug)) {
                throw new RuntimeException("Organization with slug '" + finalSlug + "' already exists!");
            }
            if (organizationSlugAliasRepository.existsByOldSlug(finalSlug)) {
                throw new RuntimeException("Subdomain slug '" + finalSlug + "' is reserved as a historical alias!");
            }
            slugType = "CUSTOM";
        }

        log.info("🚀 Creating new organization: {} with slug: {} (type: {})", request.getName(), finalSlug, slugType);

        // 1. Save Organization Profile
        Organization.OrganizationBuilder<?, ?> orgBuilder = Organization.builder()
                .name(request.getName())
                .slug(finalSlug)
                .realmKey(finalSlug) // Initial realm_key is permanently bound to the initial slug
                .slugType(slugType)
                .description(request.getDescription())
                .address(request.getAddress())
                .website(request.getWebsite())
                .subscriptionPlan(plan)
                .status("FREE".equalsIgnoreCase(targetPlanName) ? Organization.OrganizationStatus.TRIAL : Organization.OrganizationStatus.ACTIVE);

        // Handle Trial Expiry for FREE plan (14 Days Trial)
        if ("FREE".equalsIgnoreCase(targetPlanName)) {
            log.info("🎁 FREE Plan detected for {}. Setting 14-day trial expiry.", finalSlug);
            orgBuilder.trialExpiresAt(LocalDateTime.now().plusDays(14));
        }

        Organization org = orgBuilder.build();
        Organization saved = organizationRepository.saveAndFlush(org);

        // 2. Save LDAP Configurations if enabled
        if (request.isLdapEnabled()) {
            saveLdapConfig(saved, request);
        }

        // Generate random password
        String tempPassword = "Temp@" + UUID.randomUUID().toString().substring(0, 8);

        // 3. Provision Keycloak (Realm + Client + Owner + LDAP)
        try {
            String effectiveRealmKey = saved.getRealmKey() != null ? saved.getRealmKey() : saved.getSlug();
            log.info("🔑 Provisioning Keycloak for organization: {} (Realm: {})", saved.getSlug(), effectiveRealmKey);

            // Step 1: Ensure Realm & Default Client
            String planCode = saved.getSubscriptionPlan() != null && saved.getSubscriptionPlan().getName() != null
                    ? saved.getSubscriptionPlan().getName() : "FREE";
            String planDisplayName = "FREE".equalsIgnoreCase(planCode) ? "Starter 14-Day Trial"
                    : ("STARTER".equalsIgnoreCase(planCode) ? "Starter ISP"
                    : ("PRO".equalsIgnoreCase(planCode) ? "Professional ISP"
                    : ("ENTERPRISE".equalsIgnoreCase(planCode) ? "Enterprise Core" : planCode)));
            boolean hasSso = saved.getSubscriptionPlan() != null && saved.getSubscriptionPlan().isHasSso();

            keycloakService.ensureRealmExists(effectiveRealmKey, hasSso, saved.getName(), planCode, planDisplayName, saved.getLogoUrl());

            // Step 2: Create Owner Account
            String adminUsername = request.getAdminUsername() != null ? request.getAdminUsername()
                    : request.getAdminEmail();

            log.info("👤 Creating Owner User: {} (Email: {})", adminUsername, request.getAdminEmail());
            
            String ownerRoleName = "admin";
            String keycloakId = keycloakService.createOwnerUser(effectiveRealmKey, adminUsername, request.getAdminEmail(), tempPassword, ownerRoleName);

            // Step 3: Create Local User Record for Internal Mapping
            log.info("💾 Saving local user mapping for Keycloak ID: {}", keycloakId);
            User localUser = new User();
            localUser.setId(UUID.fromString(keycloakId)); // Sync ID with Keycloak
            localUser.setUsername(adminUsername);
            localUser.setEmail(request.getAdminEmail());
            localUser.setOrganization(saved);
            localUser.setStatus("ACTIVE");

            // Assign the 'admin' system role to the organization owner
            Role adminRole = roleRepository
                    .findByNameAndIsSystemRoleTrue(ownerRoleName)
                    .orElseGet(() -> roleRepository.findByName(ownerRoleName)
                            .orElseThrow(() -> new RuntimeException("Required role '" + ownerRoleName + "' not found in database")));
            localUser.setRole(adminRole);
            log.info("🛡️ Assigned role '{}' (ID: {}) to owner user '{}'", adminRole.getName(), adminRole.getId(), adminUsername);

            // CRITICAL: Use persist() instead of save() because User has a manually-assigned UUID (from Keycloak).
            entityManager.persist(localUser);

            // Step 4: Configure LDAP if requested
            if (request.isLdapEnabled()) {
                log.info("📡 Configuring LDAP Federation for realm: {}", saved.getSlug());
                com.company.ftthgis.config.tenant.LdapConfig ldapConfig = new com.company.ftthgis.config.tenant.LdapConfig();
                ldapConfig.setUrl(request.getLdapUrl());
                ldapConfig.setUserDn(request.getLdapBaseDn());
                ldapConfig.setBindDn(request.getLdapBindDn());
                ldapConfig.setBindPassword(request.getLdapBindPassword());

                keycloakService.configureLdap(saved.getSlug(), ldapConfig);
            }

            // Step 5: Initialize Tenant Vault Folders in MinIO S3 using human-readable tenant name
            try {
                String readableFolder = saved.getName() != null && !saved.getName().isBlank()
                    ? saved.getName().toLowerCase().trim().replaceAll("[^a-z0-9_.-]+", "-").replaceAll("^-+|-+$", "")
                    : saved.getSlug();
                fileStorageService.initTenantVault(readableFolder);
            } catch (Exception storageEx) {
                log.warn("⚠️ Non-fatal: storage vault init warning for {}: {}", saved.getName(), storageEx.getMessage());
            }

            log.info("✅ SUCCESS: Organization '{}' provisioned. Owner: {}, Temp Password: {}",
                    saved.getName(), adminUsername, tempPassword);

            try {
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("ownerEmail", request.getAdminEmail());
                metadata.put("plan", request.getPlan());
                
                auditLoggingService.logEvent(
                    "system",
                    "TENANT_CREATED",
                    "ORGANIZATION",
                    saved.getId().toString(),
                    new HashMap<>(),
                    Map.of("name", saved.getName(), "slug", saved.getSlug(), "status", saved.getStatus().toString()),
                    metadata
                );
            } catch (Exception auditEx) {
                log.error("Failed to log TENANT_CREATED audit event: {}", auditEx.getMessage());
            }

        } catch (Exception e) {
            log.error("❌ CRITICAL: Keycloak provisioning failed for {}. ROLLING BACK database changes.",
                    saved.getSlug());
            log.error("Error Detail: {}", e.getMessage());
            try {
                String effectiveRealmKey = saved.getRealmKey() != null ? saved.getRealmKey() : saved.getSlug();
                keycloakService.deleteRealm(effectiveRealmKey);
                log.info("🧹 Cleaned up orphan Keycloak realm '{}' after provisioning failure.", effectiveRealmKey);
            } catch (Exception cleanupEx) {
                log.warn("Failed to delete orphan realm '{}' during rollback: {}", saved.getSlug(), cleanupEx.getMessage());
            }
            throw new RuntimeException(
                    "Organization creation failed due to security provisioning error: " + e.getMessage(), e);
        }

        return Map.of(
            "organization", saved,
            "adminPassword", tempPassword
        );
    }

    public void saveLdapConfig(Organization org, OrganizationCreateRequest request) {
        saveConfig(org, "ldap_enabled", "true");
        saveConfig(org, "ldap_url", request.getLdapUrl());
        saveConfig(org, "ldap_base_dn", request.getLdapBaseDn());
        saveConfig(org, "ldap_bind_dn", request.getLdapBindDn());

        // Encrypt Bind Password before saving
        if (request.getLdapBindPassword() != null && !request.getLdapBindPassword().isEmpty()) {
            try {
                String encryptedPassword = encryptionUtils.encrypt(request.getLdapBindPassword());
                saveConfig(org, "ldap_bind_password", encryptedPassword);
            } catch (Exception e) {
                log.error("Failed to encrypt LDAP password for {}: {}", org.getSlug(), e.getMessage());
            }
        }
    }

    public void saveConfig(Organization org, String key, String value) {
        if (value == null)
            return;

        OrganizationConfig config = new OrganizationConfig();
        config.setOrganization(org);
        config.setConfigKey(key);
        config.setConfigValue(value);
        config.setActive(true);

        log.debug("💾 Saving config for {}: {} = {}", org.getSlug(), key, value);
        organizationConfigRepository.save(config);
    }

    @Transactional
    public Organization registerSelfService(OrganizationCreateRequest request) {
        String rawPlan = request.getPlan() != null ? request.getPlan().trim() : "FREE";
        String normalizedPlan = OrganizationQuotaService.normalizePlanName(rawPlan);
        SubscriptionPlan plan = subscriptionPlanRepository
                .findByName(normalizedPlan)
                .orElseGet(() -> subscriptionPlanRepository.findByName("FREE").orElse(null));

        String targetPlanName = plan != null ? plan.getName() : "FREE";
        String finalSlug;
        String slugType;
        if ("FREE".equalsIgnoreCase(targetPlanName) || request.getSlug() == null || request.getSlug().trim().isBlank()) {
            finalSlug = randomSlugGenerator.generateUniqueSlug(organizationRepository, organizationSlugAliasRepository);
            slugType = "RANDOM";
            log.info("🎲 Auto-assigned 20-char random slug '{}' for self-registered organization '{}'", finalSlug, request.getName());
        } else {
            finalSlug = request.getSlug().trim().toLowerCase();
            if (randomSlugGenerator.isReserved(finalSlug)) {
                throw new IllegalArgumentException("Subdomain slug '" + finalSlug + "' is a reserved platform keyword.");
            }
            if (!randomSlugGenerator.isValidCustomSlug(finalSlug)) {
                throw new IllegalArgumentException("Invalid subdomain slug format: '" + finalSlug + "'");
            }
            if (organizationRepository.existsBySlug(finalSlug)) {
                throw new RuntimeException("Organization with slug '" + finalSlug + "' already exists!");
            }
            if (organizationSlugAliasRepository.existsByOldSlug(finalSlug)) {
                throw new RuntimeException("Subdomain slug '" + finalSlug + "' is reserved as a historical alias!");
            }
            slugType = "CUSTOM";
        }

        log.info("📝 Self-service registration for tenant: {} with slug: {} (type: {})", request.getName(), finalSlug, slugType);

        Organization org = Organization.builder()
                .name(request.getName())
                .slug(finalSlug)
                .slugType(slugType)
                .description(request.getDescription())
                .address(request.getAddress())
                .website(request.getWebsite())
                .subscriptionPlan(plan)
                .status(Organization.OrganizationStatus.PENDING_APPROVAL)
                .build();

        Organization saved = organizationRepository.save(org);
        
        // Save temporary admin details in config
        saveConfig(saved, "pending_admin_email", request.getAdminEmail());
        saveConfig(saved, "pending_admin_username", request.getAdminUsername() != null ? request.getAdminUsername() : request.getAdminEmail());
        if (request.isLdapEnabled()) {
            saveConfig(saved, "ldap_enabled", "true");
            saveConfig(saved, "ldap_url", request.getLdapUrl());
            saveConfig(saved, "ldap_base_dn", request.getLdapBaseDn());
            saveConfig(saved, "ldap_bind_dn", request.getLdapBindDn());
            if (request.getLdapBindPassword() != null && !request.getLdapBindPassword().isEmpty()) {
                try {
                    saveConfig(saved, "ldap_bind_password", encryptionUtils.encrypt(request.getLdapBindPassword()));
                } catch (Exception e) {
                    log.error("Failed to encrypt LDAP password: {}", e.getMessage());
                }
            }
        }
        
        return saved;
    }

    @Transactional
    public Map<String, Object> approveOrganization(UUID orgId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found with ID: " + orgId));

        if (org.getStatus() != Organization.OrganizationStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Organization is not in PENDING_APPROVAL status!");
        }

        log.info("✅ Approving tenant organization: {} (Slug: {})", org.getName(), org.getSlug());

        // Retrieve pending admin details from config
        String adminEmail = org.getConfigs().stream()
                .filter(c -> "pending_admin_email".equals(c.getConfigKey()))
                .map(OrganizationConfig::getConfigValue)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Pending admin email not found in configuration!"));

        String adminUsername = org.getConfigs().stream()
                .filter(c -> "pending_admin_username".equals(c.getConfigKey()))
                .map(OrganizationConfig::getConfigValue)
                .findFirst()
                .orElse(adminEmail);

        boolean ldapEnabled = org.getConfigs().stream()
                .anyMatch(c -> "ldap_enabled".equals(c.getConfigKey()) && "true".equals(c.getConfigValue()));

        // Update status to ACTIVE
        org.setStatus(Organization.OrganizationStatus.ACTIVE);
        
        // Handle Trial Expiry for FREE plan (14 Days Trial)
        if (org.getSubscriptionPlan() != null && "FREE".equalsIgnoreCase(org.getSubscriptionPlan().getName())) {
            org.setTrialExpiresAt(LocalDateTime.now().plusDays(14));
        }

        if (org.getRealmKey() == null) {
            org.setRealmKey(org.getSlug());
        }
        Organization saved = organizationRepository.saveAndFlush(org);

        // Provision Keycloak
        String tempPassword = "Temp@" + UUID.randomUUID().toString().substring(0, 8);
        try {
            String effectiveRealmKey = saved.getRealmKey() != null ? saved.getRealmKey() : saved.getSlug();
            log.info("🔑 Provisioning Keycloak for approved organization: {} (Realm: {})", saved.getSlug(), effectiveRealmKey);
            String planCode = saved.getSubscriptionPlan() != null && saved.getSubscriptionPlan().getName() != null
                    ? saved.getSubscriptionPlan().getName() : "FREE";
            String planDisplayName = "FREE".equalsIgnoreCase(planCode) ? "Starter 14-Day Trial"
                    : ("STARTER".equalsIgnoreCase(planCode) ? "Starter ISP"
                    : ("PRO".equalsIgnoreCase(planCode) ? "Professional ISP"
                    : ("ENTERPRISE".equalsIgnoreCase(planCode) ? "Enterprise Core" : planCode)));
            boolean hasSso = saved.getSubscriptionPlan() != null && saved.getSubscriptionPlan().isHasSso();

            keycloakService.ensureRealmExists(effectiveRealmKey, hasSso, saved.getName(), planCode, planDisplayName, saved.getLogoUrl());

            String ownerRoleName = "admin";
            String keycloakId = keycloakService.createOwnerUser(effectiveRealmKey, adminUsername, adminEmail, tempPassword, ownerRoleName);

            log.info("💾 Saving local user mapping for approved tenant owner: {}", keycloakId);
            User localUser = new User();
            localUser.setId(UUID.fromString(keycloakId));
            localUser.setUsername(adminUsername);
            localUser.setEmail(adminEmail);
            localUser.setOrganization(saved);
            localUser.setStatus("ACTIVE");

            Role adminRole = roleRepository
                    .findByNameAndIsSystemRoleTrue(ownerRoleName)
                    .orElseThrow(() -> new RuntimeException("Required role '" + ownerRoleName + "' not found"));
            localUser.setRole(adminRole);

            entityManager.persist(localUser);

            // Configure LDAP if enabled
            if (ldapEnabled) {
                log.info("📡 Configuring LDAP Federation for approved realm: {}", saved.getSlug());
                com.company.ftthgis.config.tenant.LdapConfig ldapConfig = new com.company.ftthgis.config.tenant.LdapConfig();
                
                org.getConfigs().stream().filter(c -> "ldap_url".equals(c.getConfigKey())).findFirst().ifPresent(c -> ldapConfig.setUrl(c.getConfigValue()));
                org.getConfigs().stream().filter(c -> "ldap_base_dn".equals(c.getConfigKey())).findFirst().ifPresent(c -> ldapConfig.setUserDn(c.getConfigValue()));
                org.getConfigs().stream().filter(c -> "ldap_bind_dn".equals(c.getConfigKey())).findFirst().ifPresent(c -> ldapConfig.setBindDn(c.getConfigValue()));
                org.getConfigs().stream().filter(c -> "ldap_bind_password".equals(c.getConfigKey())).findFirst().ifPresent(c -> {
                    try {
                        ldapConfig.setBindPassword(encryptionUtils.decrypt(c.getConfigValue()));
                    } catch (Exception e) {
                        log.error("Failed to decrypt LDAP password: {}", e.getMessage());
                    }
                });

                keycloakService.configureLdap(saved.getSlug(), ldapConfig);
            }

            log.info("✅ APPROVED & PROVISIONED: Tenant '{}' is now active. Owner: {}", saved.getName(), adminUsername);

        } catch (Exception e) {
            log.error("❌ Keycloak provisioning failed during approval of {}: {}", saved.getSlug(), e.getMessage());
            throw new RuntimeException("Approval failed due to security provisioning error: " + e.getMessage());
        }

        return Map.of(
            "organization", saved,
            "adminPassword", tempPassword
        );
    }

    /**
     * Melakukan reset dan sinkronisasi ulang Keycloak Realm tenant.
     */
    public boolean resetTenantRealm(String slug) {
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
        
        String realmName = org.getRealmKey() != null ? org.getRealmKey() : org.getSlug();
        return keycloakService.syncRealm(realmName);
    }
}
