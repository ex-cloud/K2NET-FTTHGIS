package com.company.ftthgis.service.organization;

import com.company.ftthgis.config.security.TenantSecurity;
import com.company.ftthgis.config.tenant.KeycloakService;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSlugAliasRepository;
import com.company.ftthgis.domain.tenant.repository.SubscriptionPlanRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.FileStorageService;
import com.company.ftthgis.util.RandomSlugGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import com.company.ftthgis.service.LicenseManagementService;
import com.company.ftthgis.service.ProjectQuotaService;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationDirectoryService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final OrganizationSlugAliasRepository organizationSlugAliasRepository;
    private final RandomSlugGenerator randomSlugGenerator;
    private final TenantSecurity tenantSecurity;
    private final FileStorageService fileStorageService;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final KeycloakService keycloakService;
    private final JdbcTemplate jdbcTemplate;
    private final LicenseManagementService licenseManagementService;
    private final TenantLicenseRepository tenantLicenseRepository;
    private final ProjectQuotaService projectQuotaService;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.company.ftthgis.domain.tenant.repository.TenantBrandingRepository tenantBrandingRepository;

    @Transactional(readOnly = true)
    public List<Organization> getAllOrganizations() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt)) {
            log.warn("⚠️ Unauthorized access attempt to getAllOrganizations");
            return new ArrayList<>();
        }

        Jwt jwt = (Jwt) auth.getPrincipal();
        String issuer = jwt.getIssuer().toString();

        // 1. VIP BYPASS: If user is from the SYSTEM realm (ftth-realm) and is a super_admin
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

            var userOpt = userRepository.findById(UUID.fromString(subject));

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
            var userOpt = userRepository.findById(UUID.fromString(subject));
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
            String normalizedPlan = OrganizationQuotaService.normalizePlanName(rawPlan);

            Optional<SubscriptionPlan> planOpt = subscriptionPlanRepository.findByName(normalizedPlan);
            if (planOpt.isPresent()) {
                SubscriptionPlan newPlan = planOpt.get();
                boolean planChanged = org.getSubscriptionPlan() == null || !org.getSubscriptionPlan().getId().equals(newPlan.getId());
                org.setSubscriptionPlan(newPlan);
                if ("FREE".equalsIgnoreCase(normalizedPlan)) {
                    if (org.getTrialExpiresAt() == null) {
                        org.setTrialExpiresAt(java.time.LocalDateTime.now().plusDays(14));
                    }
                } else {
                    org.setStatus(Organization.OrganizationStatus.ACTIVE);
                    org.setTrialExpiresAt(null);
                    org.setGracePeriodUntil(null);
                }
                log.info("💳 Updated subscription plan for {} to {}", org.getSlug(), normalizedPlan);

                if (planChanged && licenseManagementService != null && tenantLicenseRepository != null) {
                    try {
                        List<TenantLicense> existing = tenantLicenseRepository.findByOrganizationIdOrderByCreatedAtDesc(org.getId());
                        for (TenantLicense lic : existing) {
                            if (lic.getStatus() == LicenseStatus.ACTIVE || lic.getStatus() == LicenseStatus.GRACE_PERIOD) {
                                lic.setStatus(LicenseStatus.REVOKED);
                                lic.setNotes((lic.getNotes() != null ? lic.getNotes() + "\n" : "") +
                                        "Superseded by Directory update to " + newPlan.getName() + " at " + java.time.LocalDateTime.now());
                                tenantLicenseRepository.save(lic);
                            }
                        }
                        int durationMonths = "FREE".equalsIgnoreCase(newPlan.getName()) ? 1 : 12;
                        licenseManagementService.issueOnlineLicense(org, newPlan, durationMonths, "SYSTEM_DIRECTORY_UPDATE");
                        if (projectQuotaService != null) {
                            projectQuotaService.evictQuotaCache(org.getId());
                        }
                        log.info("🔑 Synchronized runtime license on Directory update for org '{}' to plan '{}'", org.getSlug(), newPlan.getName());
                    } catch (Exception ex) {
                        log.warn("⚠️ Non-fatal: license sync warning on updateOrganization for {}: {}", org.getSlug(), ex.getMessage());
                    }
                }
            }
        }

        log.info("🔄 Updating organization profile: {} (Current Slug: {})", org.getName(), org.getSlug());
        Organization savedOrg = organizationRepository.save(org);

        // Synchronize tenant_branding identity if present
        try {
            tenantBrandingRepository.findByOrganizationIdNative(savedOrg.getId()).ifPresent(branding -> {
                boolean changed = false;
                if (updatedOrg.getName() != null && !updatedOrg.getName().trim().isEmpty()) {
                    branding.setCompanyName(updatedOrg.getName().trim());
                    changed = true;
                }
                if (newLogoUrl != null) {
                    branding.setLogoUrl(newLogoUrl);
                    changed = true;
                }
                if (changed) {
                    branding.setUpdatedAt(java.time.LocalDateTime.now());
                    tenantBrandingRepository.save(branding);
                    log.info("🎨 Synchronized tenant_branding identity for org '{}'", savedOrg.getSlug());
                }
            });
        } catch (Exception brandEx) {
            log.warn("⚠️ Non-fatal: could not sync tenant_branding for {}: {}", savedOrg.getSlug(), brandEx.getMessage());
        }

        // Synchronize Keycloak Realm metadata (Display Name, Subscription Tier Badge & Logo)
        try {
            String realmKey = savedOrg.getRealmKey() != null ? savedOrg.getRealmKey() : savedOrg.getSlug();
            boolean hasSso = savedOrg.getSubscriptionPlan() != null && savedOrg.getSubscriptionPlan().isHasSso();
            String planCode = savedOrg.getSubscriptionPlan() != null && savedOrg.getSubscriptionPlan().getName() != null
                    ? savedOrg.getSubscriptionPlan().getName()
                    : "FREE";
            String planDisplayName = "FREE".equalsIgnoreCase(planCode) ? "Starter 14-Day Trial"
                    : ("STARTER".equalsIgnoreCase(planCode) ? "Starter ISP"
                    : ("PRO".equalsIgnoreCase(planCode) ? "Professional ISP"
                    : ("ENTERPRISE".equalsIgnoreCase(planCode) ? "Enterprise Core" : planCode)));

            keycloakService.ensureRealmExists(realmKey, hasSso, savedOrg.getName(), planCode, planDisplayName, savedOrg.getLogoUrl());
        } catch (Exception ex) {
            log.warn("⚠️ Failed to sync Keycloak realm on org update for '{}': {}", savedOrg.getSlug(), ex.getMessage());
        }

        return savedOrg;
    }

    /**
     * Mengambil daftar pengguna riil untuk tenant (gabungan database dan Keycloak).
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getOrganizationUsers(String slug) {
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
        UUID orgId = org.getId();

        List<Map<String, Object>> userList = new ArrayList<>();

        // 1. Fetch from local database
        String sql = "SELECT u.id, u.full_name as name, u.username, u.email, u.phone, u.job_title, " +
                     "u.last_login_at, u.last_login_ip, u.mfa_enabled, u.timezone, u.locale, " +
                     "r.name as role_name, u.status, u.created_at " +
                     "FROM users u " +
                     "LEFT JOIN roles r ON u.role_id = r.id " +
                     "WHERE u.organization_id = ? " +
                     "ORDER BY u.created_at DESC";

        try {
            List<Map<String, Object>> dbUsers = jdbcTemplate.query(sql, (rs, rowNum) -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", rs.getString("id"));
                map.put("name", rs.getString("name") != null ? rs.getString("name") : rs.getString("username"));
                map.put("username", rs.getString("username"));
                map.put("email", rs.getString("email"));
                map.put("phone", rs.getString("phone") != null && !rs.getString("phone").isBlank() ? rs.getString("phone") : "—");
                map.put("jobTitle", rs.getString("job_title") != null ? rs.getString("job_title") : "");
                map.put("role", rs.getString("role_name") != null ? rs.getString("role_name") : "TENANT_ADMIN");
                map.put("status", rs.getString("status") != null ? rs.getString("status") : "ACTIVE");
                map.put("createdAt", rs.getString("created_at"));
                java.sql.Timestamp lastLoginTs = rs.getTimestamp("last_login_at");
                map.put("lastLoginAt", lastLoginTs != null ? lastLoginTs.toInstant().toString() : null);
                map.put("lastLoginIp", rs.getString("last_login_ip"));
                map.put("mfaEnabled", rs.getBoolean("mfa_enabled"));
                map.put("timezone", rs.getString("timezone"));
                map.put("locale", rs.getString("locale"));
                map.put("lastLogin", lastLoginTs != null ? lastLoginTs.toInstant().toString() : "Active recently");
                map.put("source", "DATABASE");
                return map;
            }, orgId);
            userList.addAll(dbUsers);
        } catch (Exception e) {
            log.warn("Could not query DB users for org {}: {}", slug, e.getMessage());
        }

        // 2. Fetch from Keycloak Realm
        if (org.getRealmKey() != null) {
            try {
                List<org.keycloak.representations.idm.UserRepresentation> kcUsers = keycloakService.getRealmUsers(org.getRealmKey());
                for (var kc : kcUsers) {
                    boolean alreadyInList = userList.stream().anyMatch(u -> kc.getUsername() != null && kc.getUsername().equalsIgnoreCase((String) u.get("username")));
                    if (!alreadyInList) {
                        Map<String, Object> map = new java.util.HashMap<>();
                        map.put("id", kc.getId());
                        String displayName = (kc.getFirstName() != null ? kc.getFirstName() + " " : "") + (kc.getLastName() != null ? kc.getLastName() : (kc.getUsername() != null ? kc.getUsername() : "User"));
                        map.put("name", displayName.trim());
                        map.put("username", kc.getUsername());
                        map.put("email", kc.getEmail() != null ? kc.getEmail() : kc.getUsername() + "@" + org.getSlug() + ".kdua.net");
                        String kcPhone = null;
                        String kcJobTitle = null;
                        if (kc.getAttributes() != null) {
                            if (kc.getAttributes().containsKey("phoneNumber") && !kc.getAttributes().get("phoneNumber").isEmpty()) {
                                kcPhone = kc.getAttributes().get("phoneNumber").get(0);
                            } else if (kc.getAttributes().containsKey("phone") && !kc.getAttributes().get("phone").isEmpty()) {
                                kcPhone = kc.getAttributes().get("phone").get(0);
                            }
                            if (kc.getAttributes().containsKey("jobTitle") && !kc.getAttributes().get("jobTitle").isEmpty()) {
                                kcJobTitle = kc.getAttributes().get("jobTitle").get(0);
                            }
                        }
                        map.put("phone", kcPhone != null ? kcPhone : "—");
                        map.put("jobTitle", kcJobTitle != null ? kcJobTitle : "");
                        map.put("role", "TENANT_ADMIN");
                        map.put("status", kc.isEnabled() != null && kc.isEnabled() ? "ACTIVE" : "PENDING");
                        map.put("createdAt", "2026-08-20");
                        map.put("lastLoginAt", null);
                        map.put("lastLoginIp", null);
                        map.put("mfaEnabled", false);
                        map.put("timezone", "Asia/Jakarta");
                        map.put("locale", "id");
                        map.put("lastLogin", "Active recently");
                        map.put("source", "KEYCLOAK");
                        userList.add(map);
                    }
                }
            } catch (Exception e) {
                log.warn("Could not fetch Keycloak users for realm {}: {}", org.getRealmKey(), e.getMessage());
            }
        }

        return userList;
    }
}
