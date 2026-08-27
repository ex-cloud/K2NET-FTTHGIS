package com.company.ftthgis.service;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.api.tenant.dto.OrganizationCreateRequest;
import com.company.ftthgis.domain.tenant.entity.OrganizationConfig;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.repository.OrganizationConfigRepository;
import com.company.ftthgis.domain.tenant.repository.SubscriptionPlanRepository;
import com.company.ftthgis.util.EncryptionUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;

import java.util.ArrayList;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final com.company.ftthgis.domain.user.repository.UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final com.company.ftthgis.config.tenant.KeycloakService keycloakService;
    private final OrganizationConfigRepository organizationConfigRepository;
    private final EncryptionUtils encryptionUtils;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final com.company.ftthgis.config.security.TenantSecurity tenantSecurity;
    private final com.company.ftthgis.domain.user.repository.RoleRepository roleRepository;
    
    // Asset Repositories for Cleanup
    private final com.company.ftthgis.domain.network.repository.AssetRepository assetRepository;
    private final com.company.ftthgis.domain.network.repository.NetworkNodeRepository networkNodeRepository;
    private final com.company.ftthgis.domain.network.repository.CustomerRepository customerRepository;
    private final com.company.ftthgis.domain.network.repository.FiberCableRepository fiberCableRepository;
    private final EntityManager entityManager;
    private final AuditLoggingService auditLoggingService;

    @Transactional(readOnly = true)
    public List<Organization> getAllOrganizations() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt)) {
            log.warn("⚠️ Unauthorized access attempt to getAllOrganizations");
            return new ArrayList<>();
        }

        Jwt jwt = (Jwt) auth.getPrincipal();
        String issuer = jwt.getIssuer().toString();

        // 1. VIP BYPASS: If user is from the SYSTEM realm (ftth-realm) and is a
        // super_admin
        // We check 'realm_access' claim which is standard in Keycloak JWTs
        var realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) realmAccess.get("roles");

            boolean isSuperAdmin = roles.stream().anyMatch(r -> r.equalsIgnoreCase("super_admin"));
            boolean isFromSystemRealm = issuer.contains("/realms/ftth-realm");

            if (isSuperAdmin && isFromSystemRealm) {
                log.info("👑 Superadmin from system realm detected. Granting global access.");
                return organizationRepository.findAll();
            }
        }

        // 2. FALLBACK: Check local database for assigned organization (Tenant Isolation)
        try {
            String subject = jwt.getSubject();
            if (subject == null) return new ArrayList<>();

            var userOpt = userRepository.findById(java.util.UUID.fromString(subject));

            if (userOpt.isPresent()) {
                var user = userOpt.get();

                // Check local super_admin role if not already caught by VIP bypass
                if (user.getRole() != null && user.getRole().getName().equalsIgnoreCase("super_admin")) {
                    return organizationRepository.findAll();
                }

                if (user.getOrganization() != null) {
                    log.debug("✅ Found organization '{}' for user: {}", user.getOrganization().getSlug(), subject);
                    // Unproxy the organization to prevent Jackson from crashing with ByteBuddyInterceptor
                    Organization userOrg = (Organization) org.hibernate.Hibernate.unproxy(user.getOrganization());
                    return List.of(userOrg);
                }
            } else {
                log.warn("🔍 User not found in local DB during organization list fetch: {}", subject);
            }
        } catch (Exception e) {
            log.error("❌ Error fetching user organizations: {}", e.getMessage());
        }

        log.debug("ℹ️ No organization found for user.");
        return new ArrayList<>();
    }

    @Transactional(readOnly = true)
    public Optional<Organization> getBySlug(String slug) {
        Optional<Organization> orgOpt = organizationRepository.findBySlug(slug);
        
        if (orgOpt.isEmpty()) return Optional.empty();
        
        Organization org = orgOpt.get();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        // Security Check: Is user allowed to see this specific organization?
        if (auth != null && auth.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) auth.getPrincipal();
            
            // 1. VIP Bypass for Superadmin
            var realmAccess = jwt.getClaimAsMap("realm_access");
            if (realmAccess != null && realmAccess.containsKey("roles")) {
                @SuppressWarnings("unchecked")
                List<String> roles = (List<String>) realmAccess.get("roles");
                if (roles.stream().anyMatch(r -> r.equalsIgnoreCase("super_admin"))) {
                    return Optional.of(org);
                }
            }
            
            // 2. Normal User: Check if their organization matches the requested slug
            String subject = jwt.getSubject();
            var userOpt = userRepository.findById(java.util.UUID.fromString(subject));
            if (userOpt.isPresent()) {
                var user = userOpt.get();
                if (user.getOrganization() != null && user.getOrganization().getSlug().equals(slug)) {
                    return Optional.of(org);
                }
                
                // Also check local super_admin role
                if (user.getRole() != null && user.getRole().getName().equalsIgnoreCase("super_admin")) {
                    return Optional.of(org);
                }
            }
        }
        
        log.warn("🚫 SECURITY ALERT: Unauthorized attempt to access organization slug: '{}' by user: {}", 
                 slug, auth != null ? auth.getName() : "Anonymous");
        return Optional.empty(); // Treat as not found for security
    }

    @Transactional
    public java.util.Map<String, Object> createOrganization(OrganizationCreateRequest request) {
        if (organizationRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Organization with slug '" + request.getSlug() + "' already exists!");
        }

        log.info("🚀 Creating new organization: {} with slug: {}", request.getName(), request.getSlug());

        // Lookup Subscription Plan
        SubscriptionPlan plan = subscriptionPlanRepository
                .findByName(request.getPlan() != null ? request.getPlan() : "FREE")
                .orElseGet(() -> subscriptionPlanRepository.findByName("FREE").orElse(null));

        // 1. Save Organization Profile
        Organization.OrganizationBuilder<?, ?> orgBuilder = Organization.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .description(request.getDescription())
                .address(request.getAddress())
                .website(request.getWebsite())
                .subscriptionPlan(plan)
                .status(Organization.OrganizationStatus.ACTIVE);

        // Handle Trial Expiry for FREE plan (7 Days Trial)
        if (plan != null && "FREE".equalsIgnoreCase(plan.getName())) {
            log.info("🎁 FREE Plan detected for {}. Setting 7-day trial expiry.", request.getSlug());
            orgBuilder.trialExpiresAt(java.time.LocalDateTime.now().plusDays(7));
        }

        Organization org = orgBuilder.build();

        Organization saved = organizationRepository.saveAndFlush(org);

        // 2. Save LDAP Configurations if enabled
        if (request.isLdapEnabled()) {
            saveLdapConfig(saved, request);
        }

        // Generate random password
        String tempPassword = "Temp@" + java.util.UUID.randomUUID().toString().substring(0, 8);

        // 3. Provision Keycloak (Realm + Client + Owner + LDAP)
        try {
            log.info("🔑 Provisioning Keycloak for organization: {}", saved.getSlug());

            // Step 1: Ensure Realm & Default Client
            keycloakService.ensureRealmExists(saved.getSlug());

            // Step 2: Create Owner Account
            String adminUsername = request.getAdminUsername() != null ? request.getAdminUsername()
                    : request.getAdminEmail();

            log.info("👤 Creating Owner User: {} (Email: {})", adminUsername, request.getAdminEmail());
            
            // Use standard 'admin' role name for Keycloak (Hybrid RBAC fallback will handle permissions)
            String ownerRoleName = "admin";

            String keycloakId = keycloakService.createOwnerUser(saved.getSlug(), adminUsername, request.getAdminEmail(), tempPassword, ownerRoleName);

            // Step 3: Create Local User Record for Internal Mapping
            log.info("💾 Saving local user mapping for Keycloak ID: {}", keycloakId);
            com.company.ftthgis.domain.user.entity.User localUser = new com.company.ftthgis.domain.user.entity.User();
            localUser.setId(java.util.UUID.fromString(keycloakId)); // Sync ID with Keycloak
            localUser.setUsername(adminUsername);
            localUser.setEmail(request.getAdminEmail());
            localUser.setOrganization(saved);
            localUser.setStatus("ACTIVE");

            // Assign the 'admin' system role to the organization owner
            com.company.ftthgis.domain.user.entity.Role adminRole = roleRepository
                    .findByNameAndIsSystemRoleTrue(ownerRoleName)
                    .orElseGet(() -> roleRepository.findByName(ownerRoleName)
                            .orElseThrow(() -> new RuntimeException("Required role '" + ownerRoleName + "' not found in database")));
            localUser.setRole(adminRole);
            log.info("🛡️ Assigned role '{}' (ID: {}) to owner user '{}'", adminRole.getName(), adminRole.getId(), adminUsername);

            // CRITICAL: Use persist() instead of save() because User has a manually-assigned UUID (from Keycloak).
            // Spring Data's save() calls merge() when ID is pre-set, which can lose the role association.
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

            log.info("✅ SUCCESS: Organization '{}' provisioned. Owner: {}, Temp Password: {}",
                    saved.getName(), adminUsername, tempPassword);

            try {
                java.util.Map<String, Object> metadata = new java.util.HashMap<>();
                metadata.put("ownerEmail", request.getAdminEmail());
                metadata.put("plan", request.getPlan());
                
                auditLoggingService.logEvent(
                    "system",
                    "TENANT_CREATED",
                    "ORGANIZATION",
                    saved.getId().toString(),
                    new java.util.HashMap<>(),
                    java.util.Map.of("name", saved.getName(), "slug", saved.getSlug(), "status", saved.getStatus().toString()),
                    metadata
                );
            } catch (Exception auditEx) {
                log.error("Failed to log TENANT_CREATED audit event: {}", auditEx.getMessage());
            }

        } catch (Exception e) {
            log.error("❌ CRITICAL: Keycloak provisioning failed for {}. ROLLING BACK database changes.",
                    saved.getSlug());
            log.error("Error Detail: {}", e.getMessage());
            // Throwing RuntimeException here triggers @Transactional rollback for the
            // entire DB operation
            throw new RuntimeException(
                    "Organization creation failed due to security provisioning error: " + e.getMessage());
        }

        return java.util.Map.of(
            "organization", saved,
            "adminPassword", tempPassword
        );
    }

    private void saveLdapConfig(Organization org, OrganizationCreateRequest request) {
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

    private void saveConfig(Organization org, String key, String value) {
        if (value == null)
            return;

        // Use constructor or explicit setter to avoid SuperBuilder mapping issues with
        // parent fields
        OrganizationConfig config = new OrganizationConfig();
        config.setOrganization(org);
        config.setConfigKey(key);
        config.setConfigValue(value);
        config.setActive(true);

        log.debug("💾 Saving config for {}: {} = {}", org.getSlug(), key, value);
        organizationConfigRepository.save(config);
    }

    public boolean isSlugAvailable(String slug) {
        return !organizationRepository.existsBySlug(slug);
    }

    @Transactional
    public Organization updateOrganization(String oldSlug, Organization updatedOrg) {
        // SECONDARY DEFENSE: Ensure caller is authorized even if Controller is bypassed internally
        if (!tenantSecurity.isOwner(oldSlug)) {
            log.error("🛡️ SECURITY BREACH ATTEMPT: Unauthorized update to organization '{}'", oldSlug);
            throw new SecurityException("You do not have permission to modify this organization.");
        }

        Organization org = organizationRepository.findBySlug(oldSlug)
                .orElseThrow(() -> new RuntimeException("Organization not found with slug: " + oldSlug));

        // Handle Slug Change Validation
        if (updatedOrg.getSlug() != null && !updatedOrg.getSlug().equals(org.getSlug())) {
            if (organizationRepository.existsBySlug(updatedOrg.getSlug())) {
                throw new RuntimeException("Slug '" + updatedOrg.getSlug() + "' is already taken!");
            }
            log.info("🔗 Changing slug for {} from {} to {}", org.getName(), oldSlug, updatedOrg.getSlug());
            org.setSlug(updatedOrg.getSlug());
        }

        // Handle Logo Cleanup
        String oldLogoUrl = org.getLogoUrl();
        String newLogoUrl = updatedOrg.getLogoUrl();

        if (oldLogoUrl != null && !oldLogoUrl.isEmpty() && !oldLogoUrl.equals(newLogoUrl)) {
            log.info("🗑️ Detected logo change for {}. Deleting old file: {}", oldSlug, oldLogoUrl);
            fileStorageService.deleteFile(oldLogoUrl);
        }

        org.setName(updatedOrg.getName());
        org.setLogoUrl(newLogoUrl);
        org.setDescription(updatedOrg.getDescription());
        org.setAddress(updatedOrg.getAddress());
        org.setWebsite(updatedOrg.getWebsite());
        if (updatedOrg.getStatus() != null) {
            org.setStatus(updatedOrg.getStatus());
        }
        if (updatedOrg.getSubscriptionPlan() != null) {
            org.setSubscriptionPlan(updatedOrg.getSubscriptionPlan());
        }

        log.info("🔄 Updating organization profile: {} (Current Slug: {})", org.getName(), org.getSlug());
        return organizationRepository.save(org);
    }

    @Transactional
    public void deleteOrganization(String slug) {
        // SECONDARY DEFENSE: Prevent unauthorized nuclear deletion
        if (!tenantSecurity.isOwner(slug)) {
            log.error("🛡️ CRITICAL SECURITY INCIDENT: Unauthorized deletion attempt for organization '{}'", slug);
            throw new SecurityException("You do not have permission to delete this organization. Incident logged.");
        }

        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Organization not found with slug: " + slug));

        log.warn("⚠️ NUCLEAR DELETE INITIATED: {} (Slug: {})", org.getName(), slug);

        try {
            // 1. Delete Keycloak Realm (Infrastructure Cleanup)
            log.info("🛡️ Deleting Keycloak Realm: {}", slug);
            keycloakService.deleteRealm(slug);

            // 2. Delete All Network Assets (Data Cleanup)
            // Order is important due to foreign key constraints
            log.info("📡 Cleaning up network assets for organization: {}", slug);
            
            // Delete customers and fiber cables first
            customerRepository.deleteByOrganizationId(org.getId());
            fiberCableRepository.deleteByOrganizationId(org.getId());
            
            // Delete network nodes (OLT, ODC, ODP)
            // Since they are in a joined inheritance, we delete via the repositories
            assetRepository.deleteByOrganizationId(org.getId());
            networkNodeRepository.deleteByOrganizationId(org.getId());

            // 3. Cleanup Users (Permanently Delete Tenant Users)
            List<com.company.ftthgis.domain.user.entity.User> users = userRepository.findByOrganizationId(org.getId());
            log.info("👤 Deleting {} users associated with organization: {}", users.size(), slug);
            userRepository.deleteAll(users);

            // 4. Delete Keycloak Realm
            log.info("🛡️ Deleting Keycloak Realm for: {}", slug);
            try {
                keycloakService.deleteRealm(slug);
            } catch (Exception e) {
                log.warn("⚠️ Non-critical failure deleting Keycloak realm: {}. Manual cleanup may be required.", e.getMessage());
            }

            // 5. Delete Organization Profile & Configs
            // Configs will be deleted automatically due to CascadeType.ALL in Organization entity
            if (org.getLogoUrl() != null && !org.getLogoUrl().isEmpty()) {
                log.info("🗑️ Deleting logo file for deleted organization: {}", org.getLogoUrl());
                fileStorageService.deleteFile(org.getLogoUrl());
            }
            organizationRepository.delete(org);

            try {
                auditLoggingService.logEvent(
                    "system",
                    "TENANT_DELETED",
                    "ORGANIZATION",
                    org.getId().toString(),
                    java.util.Map.of("name", org.getName(), "slug", org.getSlug(), "status", org.getStatus().toString()),
                    new java.util.HashMap<>(),
                    new java.util.HashMap<>()
                );
            } catch (Exception auditEx) {
                log.error("Failed to log TENANT_DELETED audit event: {}", auditEx.getMessage());
            }

            log.info("✅ SUCCESS: Organization '{}' and all associated resources have been nuked.", slug);

        } catch (Exception e) {
            log.error("❌ ERROR during organization deletion for {}: {}", slug, e.getMessage());
            throw new RuntimeException("Failed to perform full organization cleanup: " + e.getMessage(), e);
        }
    }

    @Transactional
    public boolean upgradeSubscription(String slug, String planName) {
        Optional<Organization> orgOpt = organizationRepository.findBySlug(slug);
        if (orgOpt.isEmpty()) {
            log.error("Organization not found for subscription upgrade: {}", slug);
            return false;
        }

        Optional<SubscriptionPlan> planOpt = subscriptionPlanRepository.findByName(planName);
        if (planOpt.isEmpty()) {
            log.error("Subscription plan not found: {}", planName);
            return false;
        }

        Organization org = orgOpt.get();
        SubscriptionPlan plan = planOpt.get();

        org.setSubscriptionPlan(plan);
        org.setStatus(Organization.OrganizationStatus.ACTIVE);
        org.setTrialExpiresAt(null); // Clear trial since they have upgraded/paid

        organizationRepository.save(org);
        log.info("✅ Successfully upgraded organization '{}' to plan '{}'", slug, planName);
        return true;
    }

    @Transactional
    public Organization registerSelfService(OrganizationCreateRequest request) {
        if (organizationRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Organization with slug '" + request.getSlug() + "' already exists!");
        }

        log.info("📝 Self-service registration for tenant: {} with slug: {}", request.getName(), request.getSlug());

        SubscriptionPlan plan = subscriptionPlanRepository
                .findByName(request.getPlan() != null ? request.getPlan() : "FREE")
                .orElseGet(() -> subscriptionPlanRepository.findByName("FREE").orElse(null));

        Organization org = Organization.builder()
                .name(request.getName())
                .slug(request.getSlug())
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
    public java.util.Map<String, Object> approveOrganization(java.util.UUID orgId) {
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
        
        // Handle Trial Expiry for FREE plan (7 Days Trial)
        if (org.getSubscriptionPlan() != null && "FREE".equalsIgnoreCase(org.getSubscriptionPlan().getName())) {
            org.setTrialExpiresAt(java.time.LocalDateTime.now().plusDays(7));
        }

        Organization saved = organizationRepository.saveAndFlush(org);

        // Provision Keycloak
        String tempPassword = "Temp@" + java.util.UUID.randomUUID().toString().substring(0, 8);
        try {
            log.info("🔑 Provisioning Keycloak for approved organization: {}", saved.getSlug());
            keycloakService.ensureRealmExists(saved.getSlug());

            String ownerRoleName = "admin";
            String keycloakId = keycloakService.createOwnerUser(saved.getSlug(), adminUsername, adminEmail, tempPassword, ownerRoleName);

            log.info("💾 Saving local user mapping for approved tenant owner: {}", keycloakId);
            com.company.ftthgis.domain.user.entity.User localUser = new com.company.ftthgis.domain.user.entity.User();
            localUser.setId(java.util.UUID.fromString(keycloakId));
            localUser.setUsername(adminUsername);
            localUser.setEmail(adminEmail);
            localUser.setOrganization(saved);
            localUser.setStatus("ACTIVE");

            com.company.ftthgis.domain.user.entity.Role adminRole = roleRepository
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

        return java.util.Map.of(
            "organization", saved,
            "adminPassword", tempPassword
        );
    }
}
