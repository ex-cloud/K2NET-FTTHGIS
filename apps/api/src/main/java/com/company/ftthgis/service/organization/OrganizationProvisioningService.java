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
import com.company.ftthgis.domain.tenant.entity.BillingInvoice;
import com.company.ftthgis.domain.tenant.entity.InvoiceStatus;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.domain.tenant.repository.BillingInvoiceRepository;
import com.company.ftthgis.service.AuditLoggingService;
import com.company.ftthgis.service.FileStorageService;
import com.company.ftthgis.service.LicenseManagementService;
import com.company.ftthgis.util.EncryptionUtils;
import com.company.ftthgis.util.RandomSlugGenerator;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Locale;
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
    private final org.springframework.transaction.PlatformTransactionManager transactionManager;
    private final FileStorageService fileStorageService;
    private final AuditLoggingService auditLoggingService;
    private final LicenseManagementService licenseManagementService;
    private final BillingInvoiceRepository billingInvoiceRepository;

    @Transactional
    public Map<String, Object> createOrganization(OrganizationCreateRequest request) {
        return createOrganization(request, null);
    }

    @Transactional
    public Map<String, Object> createOrganization(OrganizationCreateRequest request, ProvisioningProgressListener listener) {
        int activeStage = 1;
        long startStage1 = System.currentTimeMillis();

        if (listener != null) {
            listener.onStageStarted(1, "Validate Configuration & Subdomain", "Checking slug uniqueness and system authorization...");
        }

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
            if (!candidateSlug.isBlank() && randomSlugGenerator.isValidCustomSlug(candidateSlug)
                    && !randomSlugGenerator.isReserved(candidateSlug)
                    && !organizationRepository.existsBySlug(candidateSlug)
                    && (organizationSlugAliasRepository == null || !organizationSlugAliasRepository.existsByOldSlug(candidateSlug))) {
                finalSlug = candidateSlug;
                slugType = "CUSTOM";
            } else {
                finalSlug = randomSlugGenerator.generateCleanSlug(request.getName(), organizationRepository, organizationSlugAliasRepository);
                slugType = "CLEAN";
            }
            log.info("🎯 Assigned clean slug '{}' for organization '{}'", finalSlug, request.getName());
        } else if (request.getSlug() == null || request.getSlug().trim().isBlank()) {
            finalSlug = randomSlugGenerator.generateCleanSlug(request.getName(), organizationRepository, organizationSlugAliasRepository);
            slugType = "CLEAN";
            log.info("🎯 Auto-assigned clean slug '{}' for organization '{}'", finalSlug, request.getName());
        } else {
            finalSlug = request.getSlug().trim().toLowerCase();
            if (randomSlugGenerator.isReserved(finalSlug)) {
                if (listener != null) listener.onProvisioningFailed(1, "Subdomain slug '" + finalSlug + "' is a reserved platform keyword.");
                throw new IllegalArgumentException("Subdomain slug '" + finalSlug + "' is a reserved platform keyword.");
            }
            if (!randomSlugGenerator.isValidCustomSlug(finalSlug)) {
                if (listener != null) listener.onProvisioningFailed(1, "Invalid subdomain slug format: '" + finalSlug + "'");
                throw new IllegalArgumentException("Invalid subdomain slug format: '" + finalSlug + "'");
            }
            if (organizationRepository.existsBySlug(finalSlug)) {
                if (listener != null) listener.onProvisioningFailed(1, "Organization with slug '" + finalSlug + "' already exists!");
                throw new RuntimeException("Organization with slug '" + finalSlug + "' already exists!");
            }
            if (organizationSlugAliasRepository != null && organizationSlugAliasRepository.existsByOldSlug(finalSlug)) {
                if (listener != null) listener.onProvisioningFailed(1, "Subdomain slug '" + finalSlug + "' is reserved as a historical alias!");
                throw new RuntimeException("Subdomain slug '" + finalSlug + "' is reserved as a historical alias!");
            }
            slugType = "CUSTOM";
        }

        long durStage1 = Math.max(1, System.currentTimeMillis() - startStage1);
        if (listener != null) {
            listener.onStageCompleted(1, durStage1, "Subdomain slug '" + finalSlug + "' validated and reserved.");
        }

        log.info("🚀 Creating new organization: {} with slug: {} (type: {})", request.getName(), finalSlug, slugType);

        // Stage 2: Initialize Database & PostGIS
        activeStage = 2;
        long startStage2 = System.currentTimeMillis();
        if (listener != null) {
            listener.onStageStarted(2, "Initialize Database & PostGIS", "Creating organization profile and provisioning isolated data schema...");
        }

        Organization.OrganizationBuilder<?, ?> orgBuilder = Organization.builder()
                .name(request.getName())
                .slug(finalSlug)
                .realmKey(KeycloakService.TENANT_SHARED_REALM)
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

        // Save Admin & PIC Configurations
        if (request.getAdminEmail() != null && !request.getAdminEmail().isBlank()) {
            saveConfig(saved, "admin_email", request.getAdminEmail().trim());
        }
        if (request.getAdminUsername() != null && !request.getAdminUsername().isBlank()) {
            saveConfig(saved, "admin_username", request.getAdminUsername().trim());
        }
        if (request.getPicName() != null && !request.getPicName().isBlank()) {
            saveConfig(saved, "pic_name", request.getPicName().trim());
        }
        String effectivePhone = request.getEffectivePhone();
        if (effectivePhone != null && !effectivePhone.isBlank()) {
            saveConfig(saved, "admin_phone", effectivePhone);
            saveConfig(saved, "pic_phone", effectivePhone);
        }
        String effectiveJobTitle = request.getEffectiveJobTitle();
        if (effectiveJobTitle != null && !effectiveJobTitle.isBlank()) {
            saveConfig(saved, "pic_job_title", effectiveJobTitle);
        }

        // Save LDAP Configurations if enabled
        if (request.isLdapEnabled()) {
            saveLdapConfig(saved, request);
        }

        // Initialize Tenant Vault Folders in MinIO S3 using tenant slug
        try {
            fileStorageService.initTenantVault(saved.getSlug());
        } catch (Exception storageEx) {
            log.warn("⚠️ Non-fatal: storage vault init warning for {}: {}", saved.getName(), storageEx.getMessage());
        }

        long durStage2 = Math.max(1, System.currentTimeMillis() - startStage2);
        if (listener != null) {
            listener.onStageCompleted(2, durStage2, "Organization profile saved and MinIO vault initialized: tenants/" + saved.getSlug());
        }

        // Generate random password
        String tempPassword = "Temp@" + UUID.randomUUID().toString().substring(0, 8);
        String adminUsername = request.getAdminUsername() != null ? request.getAdminUsername()
                : request.getAdminEmail();
        String createdKeycloakUserId = null;

        try {
            // Stage 3: Bind Shared Keycloak 26 Tenant Realm (Zero Realm Creation & Zero Kong Reload)
            activeStage = 3;
            long startStage3 = System.currentTimeMillis();
            if (listener != null) {
                listener.onStageStarted(3, "Bind Shared Keycloak 26 Tenant Realm", "Binding tenant organization to shared 'k2net-tenants' identity plane...");
            }

            String effectiveRealmKey = KeycloakService.TENANT_SHARED_REALM;
            log.info("🔑 Binding organization '{}' to shared Keycloak realm '{}' (< 1ms, zero Kong reload)",
                    saved.getSlug(), effectiveRealmKey);

            long durStage3 = Math.max(1, System.currentTimeMillis() - startStage3);
            if (listener != null) {
                listener.onStageCompleted(3, durStage3, "Bound to shared Keycloak realm '" + effectiveRealmKey + "'.");
            }

            // Stage 4: Register Technical PIC Admin
            activeStage = 4;
            long startStage4 = System.currentTimeMillis();
            if (listener != null) {
                listener.onStageStarted(4, "Register Technical PIC Admin", "Registering technical administrator with tenant claim isolation...");
            }

            log.info("👤 Creating Owner User in '{}': {} (Email: {}, OrgId: {}, Slug: {})",
                    effectiveRealmKey, adminUsername, request.getAdminEmail(), saved.getId(), saved.getSlug());
            String ownerRoleName = "admin";
            String picName = request.getPicName() != null && !request.getPicName().isBlank() ? request.getPicName().trim() : null;
            String keycloakId = keycloakService.createTenantOwnerUser(
                    saved.getId().toString(),
                    saved.getSlug(),
                    adminUsername,
                    request.getAdminEmail(),
                    tempPassword,
                    ownerRoleName,
                    picName,
                    effectivePhone
            );
            createdKeycloakUserId = keycloakId;

            // Create Local User Record for Internal Mapping
            log.info("💾 Saving local user mapping for Keycloak ID: {}", keycloakId);
            User localUser = new User();
            localUser.setId(UUID.fromString(keycloakId)); // Sync ID with Keycloak
            localUser.setUsername(adminUsername);
            localUser.setEmail(request.getAdminEmail());
            localUser.setFullName(request.getPicName() != null && !request.getPicName().isBlank()
                    ? request.getPicName().trim() : adminUsername);
            localUser.setPhone(effectivePhone);
            String picJobTitle = request.getEffectiveJobTitle();
            localUser.setJobTitle(picJobTitle != null && !picJobTitle.isBlank() ? picJobTitle : "Organization Administrator");
            String timezone = request.getTimezone() != null && !request.getTimezone().isBlank()
                    ? request.getTimezone() : "Asia/Jakarta";
            localUser.setTimezone(timezone);
            localUser.setLocale("id");
            localUser.setMfaEnabled(false);
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
            entityManager.flush();

            long durStage4 = Math.max(1, System.currentTimeMillis() - startStage4);
            if (listener != null) {
                listener.onStageCompleted(4, durStage4, "Owner user '" + adminUsername + "' registered in '" + effectiveRealmKey + "' with 'admin' role.");
            }

            // Stage 5: Finalize Workspace & Audit Trail
            activeStage = 5;
            long startStage5 = System.currentTimeMillis();
            if (listener != null) {
                listener.onStageStarted(5, "Finalize Workspace & Audit Trail", "Completing metadata sync and preparing tenant portal...");
            }

            // Issue Cryptographic Runtime License & Initial Welcome Invoice
            try {
                String effectivePlanCode = plan != null ? plan.getName().toUpperCase(Locale.ROOT) : "FREE";
                boolean isFree = "FREE".equalsIgnoreCase(effectivePlanCode);
                int durationMonths = isFree ? 1 : 12;

                TenantLicense issuedLicense = licenseManagementService.issueOnlineLicense(
                        saved,
                        plan,
                        durationMonths,
                        "SYSTEM_PROVISIONING"
                );

                // Generate Initial Welcome Invoice
                String invNumber = "INV/" + LocalDateTime.now().getYear() + "/" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
                BigDecimal amount = (isFree || plan == null || plan.getPrice() == null)
                        ? BigDecimal.ZERO
                        : (plan.getPrice().multiply(BigDecimal.valueOf(12)));
                String invDesc = isFree
                        ? "Welcome Invoice - 14-Day Free Trial Entitlement"
                        : "Welcome Invoice - 12-Month " + effectivePlanCode + " Subscription Contract";

                BillingInvoice welcomeInvoice = BillingInvoice.builder()
                        .organization(saved)
                        .license(issuedLicense)
                        .invoiceNumber(invNumber)
                        .description(invDesc)
                        .amount(amount)
                        .currency("IDR")
                        .status(InvoiceStatus.PAID)
                        .dueDate(LocalDateTime.now().plusDays(30))
                        .paidAt(LocalDateTime.now())
                        .paymentMethod(isFree ? "FREE_TRIAL" : "B2B_CONTRACT")
                        .paymentChannel("SYSTEM")
                        .build();

                billingInvoiceRepository.save(welcomeInvoice);

                log.info("🔑 Step 6: Automatically issued runtime license '{}' and welcome invoice '{}' for organization '{}'",
                        issuedLicense.getLicenseKey(), invNumber, saved.getName());
            } catch (Exception licEx) {
                log.error("⚠️ Failed to issue automatic runtime license / welcome invoice for {}: {}", saved.getName(), licEx.getMessage(), licEx);
            }

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

            long durStage5 = Math.max(1, System.currentTimeMillis() - startStage5);
            if (listener != null) {
                listener.onStageCompleted(5, durStage5, "Cryptographic license and welcome invoice issued.");
            }

            log.info("✅ SUCCESS: Organization '{}' provisioned. Owner: {}, Temp Password: {}",
                    saved.getName(), adminUsername, tempPassword);

            Map<String, Object> result = Map.of(
                "organization", saved,
                "adminPassword", tempPassword,
                "slug", saved.getSlug(),
                "adminUsername", adminUsername,
                "id", saved.getId().toString(),
                "name", saved.getName()
            );

            if (listener != null) {
                listener.onProvisioningSuccess(result);
            }

            return result;

        } catch (Exception e) {
            log.error("❌ CRITICAL: Provisioning failed for {}. ROLLING BACK changes.",
                    saved != null ? saved.getSlug() : request.getSlug());
            log.error("Error Detail: {}", e.getMessage());

            if (listener != null) {
                listener.onProvisioningFailed(activeStage, e.getMessage());
            }

            if (saved != null) {
                if (createdKeycloakUserId != null) {
                    try {
                        keycloakService.deleteTenantUser(createdKeycloakUserId);
                    } catch (Exception cleanupEx) {
                        log.warn("Failed to delete orphan tenant user during rollback: {}", cleanupEx.getMessage());
                    }
                }

                try {
                    if (saved.getId() != null && organizationRepository.existsById(saved.getId())) {
                        organizationRepository.deleteById(saved.getId());
                        log.info("🧹 Cleaned up orphan organization record from database: {}", saved.getSlug());
                    }
                } catch (Exception dbCleanupEx) {
                    log.warn("Failed to delete orphan organization from database during rollback: {}", dbCleanupEx.getMessage());
                }
            }
            throw new RuntimeException(
                    "Organization creation failed due to security provisioning error: " + e.getMessage(), e);
        }
    }

    /**
     * Executes the organization provisioning workflow asynchronously on a background worker thread.
     * Uses TransactionTemplate to ensure the entire execution has an active EntityManager transaction.
     */
    @org.springframework.scheduling.annotation.Async
    public java.util.concurrent.CompletableFuture<Map<String, Object>> executeProvisioningAsync(
            UUID jobId,
            OrganizationCreateRequest request,
            ProvisioningProgressListener listener) {
        try {
            org.springframework.transaction.support.TransactionTemplate txTemplate =
                    new org.springframework.transaction.support.TransactionTemplate(transactionManager);
            Map<String, Object> result = txTemplate.execute(status -> createOrganization(request, listener));
            return java.util.concurrent.CompletableFuture.completedFuture(result);
        } catch (Exception e) {
            log.error("❌ Asynchronous provisioning failed for job {}: {}", jobId, e.getMessage(), e);
            java.util.concurrent.CompletableFuture<Map<String, Object>> future = new java.util.concurrent.CompletableFuture<>();
            future.completeExceptionally(e);
            return future;
        }
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
            finalSlug = randomSlugGenerator.generateCleanSlug(request.getName(), organizationRepository, organizationSlugAliasRepository);
            slugType = "CLEAN";
            log.info("🎯 Auto-assigned clean slug '{}' for self-registered organization '{}'", finalSlug, request.getName());
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
                .realmKey(KeycloakService.TENANT_SHARED_REALM)
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
        if (request.getPicName() != null && !request.getPicName().isBlank()) {
            saveConfig(saved, "pending_pic_name", request.getPicName().trim());
        }
        if (request.getEffectivePhone() != null && !request.getEffectivePhone().isBlank()) {
            saveConfig(saved, "pending_admin_phone", request.getEffectivePhone());
        }
        if (request.getEffectiveJobTitle() != null && !request.getEffectiveJobTitle().isBlank()) {
            saveConfig(saved, "pending_pic_job_title", request.getEffectiveJobTitle());
        }
        if (request.getTimezone() != null && !request.getTimezone().isBlank()) {
            saveConfig(saved, "timezone", request.getTimezone());
        }
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

        org.setRealmKey(KeycloakService.TENANT_SHARED_REALM);
        Organization saved = organizationRepository.saveAndFlush(org);

        // Provision Keycloak user inside shared 'k2net-tenants' realm
        String tempPassword = "Temp@" + UUID.randomUUID().toString().substring(0, 8);
        try {
            String effectiveRealmKey = KeycloakService.TENANT_SHARED_REALM;
            log.info("🔑 Provisioning Keycloak user for approved organization '{}' in shared realm '{}'",
                    saved.getSlug(), effectiveRealmKey);

            String adminPhone = org.getConfigs().stream()
                    .filter(c -> "pending_admin_phone".equals(c.getConfigKey()) || "admin_phone".equals(c.getConfigKey()))
                    .map(OrganizationConfig::getConfigValue)
                    .findFirst().orElse(null);
            String picName = org.getConfigs().stream()
                    .filter(c -> "pending_pic_name".equals(c.getConfigKey()) || "pic_name".equals(c.getConfigKey()))
                    .map(OrganizationConfig::getConfigValue)
                    .findFirst().orElse(null);

            String ownerRoleName = "admin";
            String keycloakId = keycloakService.createTenantOwnerUser(
                    saved.getId().toString(),
                    saved.getSlug(),
                    adminUsername,
                    adminEmail,
                    tempPassword,
                    ownerRoleName,
                    picName,
                    adminPhone
            );

            String picJobTitle = org.getConfigs().stream()
                    .filter(c -> "pending_pic_job_title".equals(c.getConfigKey()) || "pic_job_title".equals(c.getConfigKey()))
                    .map(OrganizationConfig::getConfigValue)
                    .findFirst().orElse("Organization Administrator");
            String timezone = org.getConfigs().stream()
                    .filter(c -> "timezone".equals(c.getConfigKey()))
                    .map(OrganizationConfig::getConfigValue)
                    .findFirst().orElse("Asia/Jakarta");

            log.info("💾 Saving local user mapping for approved tenant owner: {}", keycloakId);
            User localUser = new User();
            localUser.setId(UUID.fromString(keycloakId));
            localUser.setUsername(adminUsername);
            localUser.setEmail(adminEmail);
            localUser.setFullName(picName != null ? picName : adminUsername);
            localUser.setPhone(adminPhone);
            localUser.setJobTitle(picJobTitle);
            localUser.setTimezone(timezone);
            localUser.setLocale("id");
            localUser.setMfaEnabled(false);
            localUser.setOrganization(saved);
            localUser.setStatus("ACTIVE");

            Role adminRole = roleRepository
                    .findByNameAndIsSystemRoleTrue(ownerRoleName)
                    .orElseThrow(() -> new RuntimeException("Required role '" + ownerRoleName + "' not found"));
            localUser.setRole(adminRole);

            entityManager.persist(localUser);

            if (ldapEnabled) {
                log.info("📡 LDAP config retained in organization_configs for approved tenant: {}", saved.getSlug());
            }

            log.info("✅ APPROVED & PROVISIONED: Tenant '{}' is now active in '{}'. Owner: {}",
                    saved.getName(), effectiveRealmKey, adminUsername);

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
     * Melakukan reset dan sinkronisasi ulang shared Keycloak Realm tenant ('k2net-tenants').
     */
    public boolean resetTenantRealm(String slug) {
        organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
        return keycloakService.syncRealm(KeycloakService.TENANT_SHARED_REALM);
    }
}
