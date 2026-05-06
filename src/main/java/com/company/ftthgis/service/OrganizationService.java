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

    public List<Organization> getAllOrganizations() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt)) {
            log.warn("⚠️ Unauthorized access attempt to getAllOrganizations");
            return new ArrayList<>();
        }

        Jwt jwt = (Jwt) auth.getPrincipal();
        String issuer = jwt.getIssuer().toString();
        
        // 1. VIP BYPASS: If user is from the SYSTEM realm (ftth-realm) and is a super_admin
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
        String subject = jwt.getSubject();
        var userOpt = userRepository.findById(java.util.UUID.fromString(subject));
        
        if (userOpt.isPresent()) {
            var user = userOpt.get();
            
            // Check local super_admin role if not already caught by VIP bypass
            if (user.getRole() != null && user.getRole().getName().equalsIgnoreCase("super_admin")) {
                return organizationRepository.findAll();
            }

            if (user.getOrganization() != null) {
                return List.of(user.getOrganization());
            }
        }

        log.debug("ℹ️ No organization found for user: {}", subject);
        return new ArrayList<>();
    }

    public Optional<Organization> getBySlug(String slug) {
        return organizationRepository.findBySlug(slug);
    }

    @Transactional
    public Organization createOrganization(OrganizationCreateRequest request) {
        if (organizationRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Organization with slug '" + request.getSlug() + "' already exists!");
        }
        
        log.info("🚀 Creating new organization: {} with slug: {}", request.getName(), request.getSlug());
        
        // Lookup Subscription Plan
        SubscriptionPlan plan = subscriptionPlanRepository.findByName(request.getPlan() != null ? request.getPlan() : "FREE")
                .orElseGet(() -> subscriptionPlanRepository.findByName("FREE").orElse(null));

        // 1. Save Organization Profile
        Organization org = Organization.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .description(request.getDescription())
                .address(request.getAddress())
                .website(request.getWebsite())
                .subscriptionPlan(plan)
                .build();
        
        Organization saved = organizationRepository.saveAndFlush(org);
        
        // 2. Save LDAP Configurations if enabled
        if (request.isLdapEnabled()) {
            saveLdapConfig(saved, request);
        }
        
        // 3. Provision Keycloak (Realm + Client + LDAP)
        try {
            log.info("🔑 Provisioning Keycloak for organization: {}", saved.getSlug());
            keycloakService.ensureRealmExists(saved.getSlug());
            
            if (request.isLdapEnabled()) {
                log.info("📡 Configuring LDAP Federation for realm: {}", saved.getSlug());
                com.company.ftthgis.config.tenant.LdapConfig ldapConfig = new com.company.ftthgis.config.tenant.LdapConfig();
                ldapConfig.setUrl(request.getLdapUrl());
                ldapConfig.setUserDn(request.getLdapBaseDn());
                ldapConfig.setBindDn(request.getLdapBindDn());
                ldapConfig.setBindPassword(request.getLdapBindPassword());
                
                keycloakService.configureLdap(saved.getSlug(), ldapConfig);
            }
        } catch (Exception e) {
            log.error("❌ Keycloak provisioning failed for {}: {}", saved.getSlug(), e.getMessage());
            // We don't rollback DB to allow manual fix in Keycloak if needed
        }
        
        return saved;
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
        if (value == null) return;
        
        // Use constructor or explicit setter to avoid SuperBuilder mapping issues with parent fields
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
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Organization not found with slug: " + slug));
        
        log.warn("⚠️ DELETING ORGANIZATION: {} (Slug: {})", org.getName(), slug);
        
        // Manual cleanup for users to avoid FK constraints
        List<com.company.ftthgis.domain.user.entity.User> users = userRepository.findByOrganizationId(org.getId());
        for (com.company.ftthgis.domain.user.entity.User user : users) {
            user.setOrganization(null);
            userRepository.save(user);
        }
        
        organizationRepository.delete(org);
    }
}
