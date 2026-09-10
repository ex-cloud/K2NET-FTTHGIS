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
import java.util.UUID;

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
    private final com.company.ftthgis.domain.tenant.repository.OrganizationSlugAliasRepository organizationSlugAliasRepository;
    private final com.company.ftthgis.util.RandomSlugGenerator randomSlugGenerator;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

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
        // Lookup Subscription Plan
        String rawPlan = request.getPlan() != null ? request.getPlan().trim() : "FREE";
        String normalizedPlan = "FREE";
        if ("Starter".equalsIgnoreCase(rawPlan) || "FREE".equalsIgnoreCase(rawPlan) || "Trial".equalsIgnoreCase(rawPlan)) {
            normalizedPlan = "FREE";
        } else if ("Professional".equalsIgnoreCase(rawPlan) || "PRO".equalsIgnoreCase(rawPlan)) {
            normalizedPlan = "PRO";
        } else if ("Enterprise".equalsIgnoreCase(rawPlan) || "ENTERPRISE".equalsIgnoreCase(rawPlan) || "Custom".equalsIgnoreCase(rawPlan)) {
            normalizedPlan = "ENTERPRISE";
        }

        final String targetPlanName = normalizedPlan;
        SubscriptionPlan plan = subscriptionPlanRepository
                .findByName(targetPlanName)
                .orElseGet(() -> subscriptionPlanRepository.findByName("FREE").orElse(null));

        String finalSlug;
        String slugType;
        if ("FREE".equalsIgnoreCase(targetPlanName) || request.getSlug() == null || request.getSlug().trim().isBlank()) {
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
                .status(Organization.OrganizationStatus.ACTIVE);

        // Handle Trial Expiry for FREE plan (7 Days Trial)
        if ("FREE".equalsIgnoreCase(targetPlanName)) {
            log.info("🎁 FREE Plan detected for {}. Setting 7-day trial expiry.", finalSlug);
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
            String effectiveRealmKey = saved.getRealmKey() != null ? saved.getRealmKey() : saved.getSlug();
            log.info("🔑 Provisioning Keycloak for organization: {} (Realm: {})", saved.getSlug(), effectiveRealmKey);

            // Step 1: Ensure Realm & Default Client
            String planCode = saved.getSubscriptionPlan() != null && saved.getSubscriptionPlan().getName() != null
                    ? saved.getSubscriptionPlan().getName() : "FREE";
            String planDisplayName = "FREE".equalsIgnoreCase(planCode) ? "Starter Trial"
                    : ("PRO".equalsIgnoreCase(planCode) ? "Professional" : ("ENTERPRISE".equalsIgnoreCase(planCode) ? "Enterprise Core" : planCode));
            boolean hasSso = saved.getSubscriptionPlan() != null && saved.getSubscriptionPlan().isHasSso();

            keycloakService.ensureRealmExists(effectiveRealmKey, hasSso, saved.getName(), planCode, planDisplayName, saved.getLogoUrl());

            // Step 2: Create Owner Account
            String adminUsername = request.getAdminUsername() != null ? request.getAdminUsername()
                    : request.getAdminEmail();

            log.info("👤 Creating Owner User: {} (Email: {})", adminUsername, request.getAdminEmail());
            
            // Use standard 'admin' role name for Keycloak (Hybrid RBAC fallback will handle permissions)
            String ownerRoleName = "admin";

            String keycloakId = keycloakService.createOwnerUser(effectiveRealmKey, adminUsername, request.getAdminEmail(), tempPassword, ownerRoleName);

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
        if (slug == null || slug.isBlank()) {
            return false;
        }
        String normalized = slug.trim().toLowerCase();
        if (randomSlugGenerator.isReserved(normalized)) {
            return false;
        }
        return !organizationRepository.existsBySlug(normalized) &&
               !organizationSlugAliasRepository.existsByOldSlug(normalized);
    }

    @Transactional
    public Organization updateOrganization(String oldSlug, Organization updatedOrg) {
        // SECONDARY DEFENSE: Ensure caller is authorized even if Controller is bypassed internally
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isSuperAdmin = false;
        if (auth != null && auth.getAuthorities() != null) {
            isSuperAdmin = auth.getAuthorities().stream().anyMatch(a ->
                    a.getAuthority().toLowerCase().replaceFirst("^role_", "").equals("super_admin")
            );
        }
        if (!isSuperAdmin && !tenantSecurity.isOwner(oldSlug)) {
            log.error("🛡️ SECURITY BREACH ATTEMPT: Unauthorized update to organization '{}'", oldSlug);
            throw new SecurityException("You do not have permission to modify this organization.");
        }

        Organization org = organizationRepository.findBySlug(oldSlug)
                .orElseThrow(() -> new RuntimeException("Organization not found with slug: " + oldSlug));

        // Handle Slug Change Validation
        if (updatedOrg.getSlug() != null && !updatedOrg.getSlug().trim().isEmpty() && !updatedOrg.getSlug().equals(org.getSlug())) {
            if (organizationRepository.existsBySlug(updatedOrg.getSlug())) {
                throw new RuntimeException("Slug '" + updatedOrg.getSlug() + "' is already taken!");
            }
            log.info("🔗 Changing slug for {} from {} to {}", org.getName(), oldSlug, updatedOrg.getSlug());
            org.setSlug(updatedOrg.getSlug());
        }

        // Handle Logo Cleanup
        String oldLogoUrl = org.getLogoUrl();
        String newLogoUrl = updatedOrg.getLogoUrl();

        if (oldLogoUrl != null && !oldLogoUrl.isEmpty() && newLogoUrl != null && !oldLogoUrl.equals(newLogoUrl)) {
            log.info("🗑️ Detected logo change for {}. Deleting old file: {}", oldSlug, oldLogoUrl);
            fileStorageService.deleteFile(oldLogoUrl);
        }

        if (updatedOrg.getName() != null && !updatedOrg.getName().trim().isEmpty()) {
            org.setName(updatedOrg.getName());
        }
        if (newLogoUrl != null) {
            org.setLogoUrl(newLogoUrl);
        }
        if (updatedOrg.getDescription() != null) {
            org.setDescription(updatedOrg.getDescription());
        }
        if (updatedOrg.getAddress() != null) {
            org.setAddress(updatedOrg.getAddress());
        }
        if (updatedOrg.getWebsite() != null) {
            org.setWebsite(updatedOrg.getWebsite());
        }
        if (updatedOrg.getStatus() != null) {
            org.setStatus(updatedOrg.getStatus());
        }
        if (updatedOrg.getSubscriptionPlan() != null && updatedOrg.getSubscriptionPlan().getName() != null) {
            String rawPlan = updatedOrg.getSubscriptionPlan().getName().trim();
            String normalizedPlan = "PRO";
            if ("Starter".equalsIgnoreCase(rawPlan) || "FREE".equalsIgnoreCase(rawPlan) || "Trial".equalsIgnoreCase(rawPlan)) {
                normalizedPlan = "FREE";
            } else if ("Professional".equalsIgnoreCase(rawPlan) || "PRO".equalsIgnoreCase(rawPlan)) {
                normalizedPlan = "PRO";
            } else if ("Enterprise".equalsIgnoreCase(rawPlan) || "ENTERPRISE".equalsIgnoreCase(rawPlan) || "Custom".equalsIgnoreCase(rawPlan)) {
                normalizedPlan = "ENTERPRISE";
            }

            Optional<SubscriptionPlan> planOpt = subscriptionPlanRepository.findByName(normalizedPlan);
            if (planOpt.isPresent()) {
                org.setSubscriptionPlan(planOpt.get());
                if ("FREE".equalsIgnoreCase(normalizedPlan)) {
                    if (org.getTrialExpiresAt() == null) {
                        org.setTrialExpiresAt(java.time.LocalDateTime.now().plusDays(7));
                    }
                } else {
                    org.setTrialExpiresAt(null);
                }
                log.info("💳 Updated subscription plan for {} to {}", org.getSlug(), normalizedPlan);
            }
        }

        log.info("🔄 Updating organization profile: {} (Current Slug: {})", org.getName(), org.getSlug());
        Organization savedOrg = organizationRepository.save(org);

        // 🛡️ Synchronize Keycloak Realm metadata (Display Name, Subscription Tier Badge & Logo)
        try {
            String realmKey = savedOrg.getRealmKey() != null ? savedOrg.getRealmKey() : savedOrg.getSlug();
            boolean hasSso = savedOrg.getSubscriptionPlan() != null && savedOrg.getSubscriptionPlan().isHasSso();
            String planCode = savedOrg.getSubscriptionPlan() != null && savedOrg.getSubscriptionPlan().getName() != null
                    ? savedOrg.getSubscriptionPlan().getName()
                    : "FREE";
            String planDisplayName = "FREE".equalsIgnoreCase(planCode) ? "Starter Trial"
                    : ("PRO".equalsIgnoreCase(planCode) ? "Professional" : ("ENTERPRISE".equalsIgnoreCase(planCode) ? "Enterprise Core" : planCode));

            keycloakService.ensureRealmExists(realmKey, hasSso, savedOrg.getName(), planCode, planDisplayName, savedOrg.getLogoUrl());
        } catch (Exception ex) {
            log.warn("⚠️ Failed to sync Keycloak realm on org update for '{}': {}", savedOrg.getSlug(), ex.getMessage());
        }

        return savedOrg;
    }

    private final com.company.ftthgis.domain.tenant.repository.ProjectRepository projectRepository;

    public java.util.Map<String, Object> getImpactSummary(String idOrSlug) {
        Organization org = organizationRepository.findBySlug(idOrSlug)
                .or(() -> {
                    try {
                        return organizationRepository.findById(UUID.fromString(idOrSlug));
                    } catch (Exception e) {
                        return Optional.empty();
                    }
                })
                .orElseThrow(() -> new RuntimeException("Organization not found with slug or id: " + idOrSlug));

        long projectsCount = projectRepository.countByOrganizationId(org.getId());
        long nodesCount = networkNodeRepository.countByOrganizationId(org.getId());
        long cablesCount = fiberCableRepository.countByOrganizationId(org.getId());
        long usersCount = userRepository.countByOrganizationId(org.getId());

        java.util.Map<String, Object> summary = new java.util.HashMap<>();
        summary.put("organizationId", org.getId());
        summary.put("organizationName", org.getName());
        summary.put("slug", org.getSlug());
        summary.put("projectsCount", projectsCount);
        summary.put("nodesCount", nodesCount);
        summary.put("cablesCount", cablesCount);
        summary.put("usersCount", usersCount);
        summary.put("keycloakRealm", org.getSlug());
        summary.put("status", org.getStatus() != null ? org.getStatus().toString() : "ACTIVE");
        return summary;
    }

    public java.util.Map<String, Object> exportTenantBackup(String idOrSlug) {
        Organization org = organizationRepository.findBySlug(idOrSlug)
                .or(() -> {
                    try {
                        return organizationRepository.findById(UUID.fromString(idOrSlug));
                    } catch (Exception e) {
                        return Optional.empty();
                    }
                })
                .orElseThrow(() -> new RuntimeException("Organization not found with slug or id: " + idOrSlug));

        java.util.List<com.company.ftthgis.domain.tenant.entity.Project> projects = projectRepository.findByOrganizationId(org.getId());
        java.util.Map<String, Object> backup = new java.util.HashMap<>();
        backup.put("exportedAt", java.time.Instant.now().toString());
        backup.put("platform", "K2NET FTTH GIS Enterprise Platform");
        backup.put("organization", java.util.Map.of(
                "id", org.getId(),
                "name", org.getName(),
                "slug", org.getSlug(),
                "website", org.getWebsite() != null ? org.getWebsite() : "",
                "address", org.getAddress() != null ? org.getAddress() : "",
                "plan", org.getSubscriptionPlan() != null ? org.getSubscriptionPlan().getName() : "FREE"
        ));
        backup.put("projects", projects.stream().map(p -> java.util.Map.of(
                "id", p.getId(),
                "name", p.getName(),
                "code", p.getCode(),
                "region", p.getRegion() != null ? p.getRegion() : ""
        )).toList());
        backup.put("summary", getImpactSummary(idOrSlug));
        return backup;
    }

    @Transactional
    public void deleteOrganization(String idOrSlug, String mode, String reason) {
        Organization org = organizationRepository.findBySlug(idOrSlug)
                .or(() -> {
                    try {
                        return organizationRepository.findById(UUID.fromString(idOrSlug));
                    } catch (Exception e) {
                        return Optional.empty();
                    }
                })
                .orElseThrow(() -> new RuntimeException("Organization not found with slug or id: " + idOrSlug));

        String slug = org.getSlug();

        // ROOT PLATFORM DEFENSE: Prevent deletion of Main / System Organization
        if ("default".equalsIgnoreCase(slug) || "00000000-0000-0000-0000-000000000001".equals(org.getId().toString())) {
            log.warn("🛡️ PREVENTED: Attempt to delete root platform organization '{}' (ID: {})", slug, org.getId());
            throw new IllegalArgumentException("Root Platform Organization (default) is immutable and protected from deletion.");
        }

        // SECONDARY DEFENSE: Prevent unauthorized deletion
        if (!tenantSecurity.isOwner(slug)) {
            log.error("🛡️ CRITICAL SECURITY INCIDENT: Unauthorized deletion attempt for organization '{}'", slug);
            throw new SecurityException("You do not have permission to delete this organization. Incident logged.");
        }

        // TIER 2: NUCLEAR WIPE MODE (Permanent Physical Destruction)
        if ("nuclear".equalsIgnoreCase(mode)) {
            log.warn("⚠️ NUCLEAR DELETE INITIATED: {} (Slug: {})", org.getName(), slug);
            try {
                UUID orgId = org.getId();
                String orgIdStr = orgId.toString();
                String effectiveRealmKey = org.getRealmKey() != null && !org.getRealmKey().trim().isEmpty() ? org.getRealmKey() : slug;

                // 1. Delete Keycloak Realm (Infrastructure Cleanup)
                log.info("🛡️ Deleting Keycloak Realm: {} (effective realmKey: {})", slug, effectiveRealmKey);
                try {
                    keycloakService.deleteRealm(effectiveRealmKey);
                } catch (Exception e) {
                    log.warn("⚠️ Non-critical failure deleting Keycloak realm: {}. Manual cleanup may be required.", e.getMessage());
                }
                if (!effectiveRealmKey.equalsIgnoreCase(slug)) {
                    try {
                        keycloakService.deleteRealm(slug);
                    } catch (Exception ignored) {}
                }

                // 2. Delete Logo File in Storage if exists
                if (org.getLogoUrl() != null && !org.getLogoUrl().isEmpty()) {
                    log.info("🗑️ Deleting logo file for deleted organization: {}", org.getLogoUrl());
                    try {
                        fileStorageService.deleteFile(org.getLogoUrl());
                    } catch (Exception ignored) {}
                }

                // 3. Native Cascaded Nuclear Database Wipe in strict topological dependency order
                log.info("💥 Executing atomic SQL cascade wipe for organization: {} (ID: {})", slug, orgId);

                // A. Fiber & Splice & Splitter level
                jdbcTemplate.update("DELETE FROM splitter_port WHERE node_id IN (SELECT id FROM network_nodes WHERE organization_id = ?) OR connected_core_id IN (SELECT id FROM fiber_core WHERE cable_id IN (SELECT id FROM network_edges WHERE organization_id = ?))", orgId, orgId);
                jdbcTemplate.update("DELETE FROM fiber_splice WHERE from_core_id IN (SELECT id FROM fiber_core WHERE cable_id IN (SELECT id FROM network_edges WHERE organization_id = ?)) OR to_core_id IN (SELECT id FROM fiber_core WHERE cable_id IN (SELECT id FROM network_edges WHERE organization_id = ?))", orgId, orgId);
                jdbcTemplate.update("DELETE FROM fiber_core WHERE cable_id IN (SELECT id FROM network_edges WHERE organization_id = ?) OR from_node_id IN (SELECT id FROM network_nodes WHERE organization_id = ?) OR to_node_id IN (SELECT id FROM network_nodes WHERE organization_id = ?)", orgId, orgId, orgId);
                jdbcTemplate.update("DELETE FROM network_edges WHERE organization_id = ?", orgId);

                // B. Network Nodes Hierarchy (customers, odp, odc, olt -> network_nodes)
                jdbcTemplate.update("DELETE FROM customers WHERE id IN (SELECT id FROM network_nodes WHERE organization_id = ?)", orgId);
                jdbcTemplate.update("DELETE FROM odp WHERE id IN (SELECT id FROM network_nodes WHERE organization_id = ?)", orgId);
                jdbcTemplate.update("DELETE FROM odc WHERE id IN (SELECT id FROM network_nodes WHERE organization_id = ?)", orgId);
                jdbcTemplate.update("DELETE FROM olt WHERE id IN (SELECT id FROM network_nodes WHERE organization_id = ?)", orgId);
                jdbcTemplate.update("DELETE FROM network_nodes WHERE organization_id = ?", orgId);
                jdbcTemplate.update("DELETE FROM assets WHERE organization_id = ?", orgId);
                jdbcTemplate.update("DELETE FROM asset_categories WHERE organization_id = ?", orgId);

                // C. AI & Knowledge level
                jdbcTemplate.update("DELETE FROM ai_documents WHERE tenant_id = ?", orgId);
                jdbcTemplate.update("DELETE FROM ai_chat_sessions WHERE tenant_id = ?", orgId);
                jdbcTemplate.update("DELETE FROM ai_query_analytics WHERE tenant_id = ?", orgId);
                jdbcTemplate.update("DELETE FROM ai_suggested_prompts WHERE tenant_id = ?", orgId);
                jdbcTemplate.update("DELETE FROM ai_agent_authorizations WHERE tenant_id = ?", orgId);

                // D. Tasks level
                jdbcTemplate.update("DELETE FROM tasks WHERE organization_id = ?", orgId);

                // E. Impersonation sessions, User Devices, Security Events & Audit Logs
                jdbcTemplate.update("DELETE FROM impersonation_sessions WHERE target_organization_id = ? OR actor_user_id IN (SELECT id FROM users WHERE organization_id = ?)", orgId, orgId);
                jdbcTemplate.update("DELETE FROM user_devices WHERE user_id IN (SELECT id FROM users WHERE organization_id = ?)", orgId);
                jdbcTemplate.update("DELETE FROM user_audit_logs WHERE organization_id = ? OR target_user_id IN (SELECT id FROM users WHERE organization_id = ?)", orgId, orgId);
                jdbcTemplate.update("DELETE FROM security_events WHERE user_id IN (SELECT id FROM users WHERE organization_id = ?)", orgId);

                // F. Project Members & Users
                jdbcTemplate.update("DELETE FROM project_members WHERE organization_id = ? OR project_id IN (SELECT id FROM projects WHERE organization_id = ?) OR user_id IN (SELECT id FROM users WHERE organization_id = ?)", orgId, orgId, orgId);
                jdbcTemplate.update("DELETE FROM users WHERE organization_id = ?", orgId);

                // G. Projects
                jdbcTemplate.update("DELETE FROM projects WHERE organization_id = ?", orgId);

                // H. Roles & Permissions (tenant-specific roles)
                jdbcTemplate.update("DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE organization_id = ? AND is_system_role = false)", orgId);
                jdbcTemplate.update("DELETE FROM roles WHERE organization_id = ? AND is_system_role = false", orgId);

                // I. Configs, Aliases, Payments
                jdbcTemplate.update("DELETE FROM organization_configs WHERE organization_id = ?", orgId);
                jdbcTemplate.update("DELETE FROM organization_slug_aliases WHERE organization_id = ?", orgId);
                jdbcTemplate.update("DELETE FROM payment_transactions WHERE org_slug = ?", slug);

                // J. Organization Entity
                jdbcTemplate.update("DELETE FROM organizations WHERE id = ?", orgId);

                // Flush and clear EntityManager to avoid stale entities in Hibernate Session
                entityManager.clear();

                // L2 Cache Eviction for Roles & Organizations
                try {
                    entityManager.getEntityManagerFactory().getCache().evict(Organization.class, orgId);
                } catch (Exception ignored) {}

                try {
                    auditLoggingService.logEvent(
                        "system",
                        "TENANT_NUCLEAR_DELETED",
                        "ORGANIZATION",
                        orgIdStr,
                        java.util.Map.of("name", org.getName(), "slug", org.getSlug(), "status", "NUCLEAR_DELETED"),
                        new java.util.HashMap<>(),
                        new java.util.HashMap<>()
                    );
                } catch (Exception auditEx) {
                    log.error("Failed to log TENANT_NUCLEAR_DELETED audit event: {}", auditEx.getMessage());
                }

                log.info("✅ SUCCESS: Organization '{}' and all associated resources have been nuked.", slug);
                return;
            } catch (Exception e) {
                log.error("❌ ERROR during nuclear organization deletion for {}: {}", slug, e.getMessage());
                throw new RuntimeException("Failed to perform nuclear organization cleanup: " + e.getMessage(), e);
            }
        }

        // TIER 1: SOFT DELETE / GRACE PERIOD (30 Hari ke Recycle Bin)
        log.warn("🗑️ TIER 1 SOFT DELETE INITIATED: {} (Slug: {}) - Reason: {}", org.getName(), slug, reason);
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String currentUsername = auth != null ? auth.getName() : "admin";
            org.setDeletedAt(java.time.LocalDateTime.now());
            org.setDeletedBy(currentUsername);
            org.setStatus(Organization.OrganizationStatus.SUSPENDED);
            organizationRepository.save(org);

            // Immediate Lockout: Disable Keycloak Realm so tenant users cannot authenticate
            keycloakService.setRealmEnabled(slug, false);

            try {
                auditLoggingService.logEvent(
                    "system",
                    "TENANT_SOFT_DELETED",
                    "ORGANIZATION",
                    org.getId().toString(),
                    java.util.Map.of("name", org.getName(), "slug", org.getSlug(), "mode", "SOFT_DELETE", "reason", reason != null ? reason : "Recycle Bin Grace Period"),
                    new java.util.HashMap<>(),
                    new java.util.HashMap<>()
                );
            } catch (Exception auditEx) {
                log.error("Failed to log TENANT_SOFT_DELETED audit event: {}", auditEx.getMessage());
            }

            log.info("✅ SUCCESS: Organization '{}' moved to Recycle Bin (Keycloak Realm disabled).", slug);
        } catch (Exception e) {
            log.error("❌ ERROR during soft deletion for {}: {}", slug, e.getMessage());
            throw new RuntimeException("Gagal memindahkan organisasi ke Recycle Bin: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void restoreOrganization(String idOrSlug) {
        Organization org = organizationRepository.findBySlug(idOrSlug)
                .or(() -> {
                    try {
                        return organizationRepository.findById(UUID.fromString(idOrSlug));
                    } catch (Exception e) {
                        return Optional.empty();
                    }
                })
                .orElseThrow(() -> new RuntimeException("Organization not found with slug or id: " + idOrSlug));

        String slug = org.getSlug();
        org.setDeletedAt(null);
        org.setDeletedBy(null);
        org.setStatus(Organization.OrganizationStatus.ACTIVE);
        organizationRepository.save(org);

        // Re-enable Keycloak realm
        keycloakService.setRealmEnabled(slug, true);

        try {
            auditLoggingService.logEvent(
                "system",
                "TENANT_RESTORED",
                "ORGANIZATION",
                org.getId().toString(),
                java.util.Map.of("name", org.getName(), "slug", org.getSlug()),
                new java.util.HashMap<>(),
                new java.util.HashMap<>()
            );
        } catch (Exception ignored) {}

        log.info("🔄 SUCCESS: Organization '{}' restored and Keycloak realm re-enabled.", slug);
    }

    @Transactional
    public Organization importTenantBackup(com.company.ftthgis.api.tenant.dto.OrganizationImportRequest request) {
        if (request.getOrganization() == null) {
            throw new IllegalArgumentException("Organization payload is required in backup file");
        }

        java.util.Map<String, Object> orgMap = request.getOrganization();
        String name = (String) orgMap.getOrDefault("name", "Imported Tenant");
        String slug = (String) orgMap.getOrDefault("slug", "tenant-" + System.currentTimeMillis());
        String planName = (String) orgMap.getOrDefault("plan", "FREE");
        String website = (String) orgMap.getOrDefault("website", "");
        String address = (String) orgMap.getOrDefault("address", "");

        log.info("📦 Importing tenant backup for slug: '{}' (Name: '{}')", slug, name);

        // Check if organization already exists
        Optional<Organization> existingOpt = organizationRepository.findBySlug(slug);
        Organization org;

        if (existingOpt.isPresent()) {
            org = existingOpt.get();
            log.info("🔄 Organization '{}' exists. Restoring and updating from backup...", slug);
            org.setName(name);
            org.setWebsite(website);
            org.setAddress(address);
            org.setDeletedAt(null);
            org.setDeletedBy(null);
            org.setStatus(Organization.OrganizationStatus.ACTIVE);
            org = organizationRepository.save(org);
        } else {
            SubscriptionPlan plan = subscriptionPlanRepository.findByName(planName)
                    .orElseGet(() -> subscriptionPlanRepository.findByName("FREE").orElse(null));

            org = Organization.builder()
                    .name(name)
                    .slug(slug)
                    .realmKey(slug)
                    .website(website)
                    .address(address)
                    .subscriptionPlan(plan)
                    .status(Organization.OrganizationStatus.ACTIVE)
                    .build();
            org = organizationRepository.save(org);

            // Default configs
            saveConfig(org, "keycloak_realm", slug);
            saveConfig(org, "import_source", "json_backup");
        }

        // Ensure Keycloak Realm is created & enabled
        try {
            String realmToEnsure = org.getRealmKey() != null ? org.getRealmKey() : org.getSlug();
            String planCode = org.getSubscriptionPlan() != null && org.getSubscriptionPlan().getName() != null
                    ? org.getSubscriptionPlan().getName() : "FREE";
            String planDisplayName = "FREE".equalsIgnoreCase(planCode) ? "Starter Trial"
                    : ("PRO".equalsIgnoreCase(planCode) ? "Professional" : ("ENTERPRISE".equalsIgnoreCase(planCode) ? "Enterprise Core" : planCode));
            boolean hasSso = org.getSubscriptionPlan() != null && org.getSubscriptionPlan().isHasSso();

            keycloakService.ensureRealmExists(realmToEnsure, hasSso, org.getName(), planCode, planDisplayName, org.getLogoUrl());
            keycloakService.setRealmEnabled(realmToEnsure, true);
        } catch (Exception e) {
            log.warn("⚠️ Non-critical failure provisioning Keycloak realm for imported tenant {}: {}", slug, e.getMessage());
        }

        // Import projects if present
        if (request.getProjects() != null && !request.getProjects().isEmpty()) {
            for (java.util.Map<String, Object> projMap : request.getProjects()) {
                String projName = (String) projMap.getOrDefault("name", "Default Project");
                String projCode = (String) projMap.getOrDefault("code", "PRJ-" + slug.toUpperCase());
                String region = (String) projMap.getOrDefault("region", "ap-southeast-1");

                if (!projectRepository.existsByCodeAndOrganizationId(projCode, org.getId())) {
                    try {
                        com.company.ftthgis.domain.tenant.entity.Project project = com.company.ftthgis.domain.tenant.entity.Project.builder()
                                .name(projName)
                                .code(projCode)
                                .region(region)
                                .organization(org)
                                .build();
                        projectRepository.save(project);
                    } catch (Exception projEx) {
                        log.warn("⚠️ Failed to import project {}: {}", projCode, projEx.getMessage());
                    }
                }
            }
        }

        try {
            auditLoggingService.logEvent(
                "system",
                "TENANT_IMPORTED",
                "ORGANIZATION",
                org.getId().toString(),
                java.util.Map.of("name", org.getName(), "slug", org.getSlug()),
                new java.util.HashMap<>(),
                new java.util.HashMap<>()
            );
        } catch (Exception ignored) {}

        log.info("✅ SUCCESS: Tenant '{}' imported and provisioned successfully.", slug);
        return org;
    }

    @Transactional
    public void deleteOrganization(String idOrSlug) {
        deleteOrganization(idOrSlug, "soft", "Recycle Bin Deletion");
    }

    @Transactional
    public boolean upgradeSubscription(String slug, String planName) {
        Optional<Organization> orgOpt = organizationRepository.findBySlug(slug);
        if (orgOpt.isEmpty()) {
            log.error("Organization not found for subscription upgrade: {}", slug);
            return false;
        }

        String rawPlan = planName != null ? planName.trim() : "PRO";
        String normalizedPlan = "PRO";
        if ("Starter".equalsIgnoreCase(rawPlan) || "FREE".equalsIgnoreCase(rawPlan) || "Trial".equalsIgnoreCase(rawPlan)) {
            normalizedPlan = "FREE";
        } else if ("Professional".equalsIgnoreCase(rawPlan) || "PRO".equalsIgnoreCase(rawPlan)) {
            normalizedPlan = "PRO";
        } else if ("Enterprise".equalsIgnoreCase(rawPlan) || "ENTERPRISE".equalsIgnoreCase(rawPlan) || "Custom".equalsIgnoreCase(rawPlan)) {
            normalizedPlan = "ENTERPRISE";
        }

        Optional<SubscriptionPlan> planOpt = subscriptionPlanRepository.findByName(normalizedPlan);
        if (planOpt.isEmpty()) {
            log.error("Subscription plan not found: {}", planName);
            return false;
        }

        Organization org = orgOpt.get();
        SubscriptionPlan plan = planOpt.get();

        org.setSubscriptionPlan(plan);
        if ("FREE".equalsIgnoreCase(normalizedPlan)) {
            if (org.getTrialExpiresAt() == null) {
                org.setTrialExpiresAt(java.time.LocalDateTime.now().plusDays(7));
            }
        } else {
            org.setStatus(Organization.OrganizationStatus.ACTIVE);
            org.setTrialExpiresAt(null); // Clear trial since they have upgraded/paid
        }

        organizationRepository.save(org);
        log.info("✅ Successfully upgraded organization '{}' to plan '{}'", slug, normalizedPlan);
        return true;
    }

    @Transactional
    public Organization registerSelfService(OrganizationCreateRequest request) {
        String rawPlan = request.getPlan() != null ? request.getPlan().trim() : "FREE";
        SubscriptionPlan plan = subscriptionPlanRepository
                .findByName(rawPlan)
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

        if (org.getRealmKey() == null) {
            org.setRealmKey(org.getSlug());
        }
        Organization saved = organizationRepository.saveAndFlush(org);

        // Provision Keycloak
        String tempPassword = "Temp@" + java.util.UUID.randomUUID().toString().substring(0, 8);
        try {
            String effectiveRealmKey = saved.getRealmKey() != null ? saved.getRealmKey() : saved.getSlug();
            log.info("🔑 Provisioning Keycloak for approved organization: {} (Realm: {})", saved.getSlug(), effectiveRealmKey);
            String planCode = saved.getSubscriptionPlan() != null && saved.getSubscriptionPlan().getName() != null
                    ? saved.getSubscriptionPlan().getName() : "FREE";
            String planDisplayName = "FREE".equalsIgnoreCase(planCode) ? "Starter Trial"
                    : ("PRO".equalsIgnoreCase(planCode) ? "Professional" : ("ENTERPRISE".equalsIgnoreCase(planCode) ? "Enterprise Core" : planCode));
            boolean hasSso = saved.getSubscriptionPlan() != null && saved.getSubscriptionPlan().isHasSso();

            keycloakService.ensureRealmExists(effectiveRealmKey, hasSso, saved.getName(), planCode, planDisplayName, saved.getLogoUrl());

            String ownerRoleName = "admin";
            String keycloakId = keycloakService.createOwnerUser(effectiveRealmKey, adminUsername, adminEmail, tempPassword, ownerRoleName);

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

    @Transactional(readOnly = true)
    public List<SubscriptionPlan> getAllSubscriptionPlans() {
        return subscriptionPlanRepository.findAll();
    }
}
