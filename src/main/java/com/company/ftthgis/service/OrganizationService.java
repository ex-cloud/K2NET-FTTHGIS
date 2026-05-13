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
    private final com.company.ftthgis.domain.user.repository.RoleRepository roleRepository;
    private final com.company.ftthgis.config.security.TenantSecurity tenantSecurity;
    
    // Asset Repositories for Cleanup
    private final com.company.ftthgis.domain.network.repository.AssetRepository assetRepository;
    private final com.company.ftthgis.domain.network.repository.NetworkNodeRepository networkNodeRepository;
    private final com.company.ftthgis.domain.network.repository.CustomerRepository customerRepository;
    private final com.company.ftthgis.domain.network.repository.FiberCableRepository fiberCableRepository;

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

        // Handle Trial Expiry for FREE plan (1 Minute for TESTING)
        if (plan != null && "FREE".equalsIgnoreCase(plan.getName())) {
            log.info("🎁 FREE Plan detected for {}. Setting 1-minute trial expiry for testing.", request.getSlug());
            orgBuilder.trialExpiresAt(java.time.LocalDateTime.now().plusMinutes(1));
        }

        Organization org = orgBuilder.build();

        Organization saved = organizationRepository.saveAndFlush(org);

        // 1.5 Clone System Roles for this Organization
        cloneSystemRolesForOrganization(saved);

        // 2. Save LDAP Configurations if enabled
        if (request.isLdapEnabled()) {
            saveLdapConfig(saved, request);
        }

        // Generate random password outside try block so it's accessible in the return statement
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
            
            // Step 2.1: Get the default admin role name from DB
            String ownerRoleName = roleRepository.findByNameAndIsSystemRoleTrue("admin")
                    .map(com.company.ftthgis.domain.user.entity.Role::getName)
                    .orElse("admin"); // Fallback to "admin" if not found

            String keycloakId = keycloakService.createOwnerUser(saved.getSlug(), adminUsername, request.getAdminEmail(), tempPassword, ownerRoleName);

            // Step 3: Create Local User Record for Internal Mapping
            log.info("💾 Saving local user mapping for Keycloak ID: {}", keycloakId);
            com.company.ftthgis.domain.user.entity.User localUser = new com.company.ftthgis.domain.user.entity.User();
            localUser.setId(java.util.UUID.fromString(keycloakId)); // Sync ID with Keycloak
            localUser.setUsername(adminUsername);
            localUser.setEmail(request.getAdminEmail());
            localUser.setOrganization(saved);
            localUser.setStatus("ACTIVE");
            
            // Assign Owner/Admin Role in Local DB (from the newly cloned roles)
            roleRepository.findByNameAndOrganizationId("admin", saved.getId()).ifPresent(localUser::setRole);
            
            userRepository.save(localUser);

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
            organizationRepository.delete(org);

            log.info("✅ SUCCESS: Organization '{}' and all associated resources have been nuked.", slug);

        } catch (Exception e) {
            log.error("❌ ERROR during organization deletion for {}: {}", slug, e.getMessage());
            throw new RuntimeException("Failed to perform full organization cleanup: " + e.getMessage(), e);
        }
    }

    private void cloneSystemRolesForOrganization(Organization organization) {
        List<com.company.ftthgis.domain.user.entity.Role> systemRoles = roleRepository.findByIsSystemRoleTrue();
        
        for (com.company.ftthgis.domain.user.entity.Role systemRole : systemRoles) {
            com.company.ftthgis.domain.user.entity.Role clonedRole = new com.company.ftthgis.domain.user.entity.Role();
            clonedRole.setName(systemRole.getName());
            clonedRole.setDisplayName(systemRole.getDisplayName());
            clonedRole.setDescription(systemRole.getDescription());
            clonedRole.setSystemRole(false);
            clonedRole.setOrganization(organization);
            
            // Copy permissions (must be mutable copy)
            clonedRole.setPermissions(new java.util.HashSet<>(systemRole.getPermissions()));
            
            roleRepository.save(clonedRole);
        }
        log.info("✅ Cloned {} system roles for organization: {}", systemRoles.size(), organization.getSlug());
    }
}
