package com.company.ftthgis.config.security;

import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.domain.tenant.entity.Organization;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component("tenantSecurity")
@RequiredArgsConstructor
@Slf4j
public class TenantSecurity {

    private final UserRepository userRepository;

    @Value("${keycloak.server-url}")
    private String keycloakServerUrl;

    /**
     * Checks if the currently authenticated user belongs to the specified organization slug,
     * or if the user is a super_admin from the global system realm.
     *
     * @param orgSlug The slug of the organization to check against
     * @return true if authorized, false otherwise
     */
    public boolean isOwner(String orgSlug) {
        if (orgSlug == null || orgSlug.trim().isEmpty()) {
            return false;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt)) {
            log.warn("🛡️ TenantSecurity: No valid JWT authentication found.");
            return false;
        }

        Jwt jwt = (Jwt) auth.getPrincipal();
        String issuer = jwt.getIssuer() != null ? jwt.getIssuer().toString() : "";

        // 1. VIP Bypass for System Superadmin
        var realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) realmAccess.get("roles");
            boolean isSuperAdmin = roles.stream().anyMatch(r -> r.equalsIgnoreCase("super_admin"));
            // Global realm check (assuming 'ftth-realm' is the system realm)
            boolean isFromSystemRealm = issuer.contains("/realms/ftth-realm");

            if (isSuperAdmin && isFromSystemRealm) {
                log.debug("🛡️ TenantSecurity: Access granted to SUPER_ADMIN from system realm.");
                return true;
            }
        }

        // 2. Normal Tenant Isolation Check
        try {
            String subject = jwt.getSubject();
            if (subject == null) return false;

            var userOpt = userRepository.findByIdWithOrganization(UUID.fromString(subject));
            if (userOpt.isPresent()) {
                var user = userOpt.get();
                Organization org = user.getOrganization();
                
                if (org != null) {
                    // Force initialization if it's a proxy to avoid "no Session" error
                    String userOrgSlug = org.getSlug(); 
                    if (userOrgSlug.equals(orgSlug)) {
                        log.debug("🛡️ TenantSecurity: Access granted. User belongs to organization slug: {}", orgSlug);
                        return true;
                    }
                }
                log.warn("🛡️ TenantSecurity: Access DENIED. User's org slug mismatch for user: {}", subject);
            } else {
                log.warn("🛡️ TenantSecurity: User {} not found in local database.", subject);
            }
        } catch (Exception e) {
            log.error("🛡️ TenantSecurity: Error verifying tenant ownership: {}", e.getMessage(), e);
        }

        return false;
    }

    /**
     * Checks if the currently authenticated user belongs to the specified organization ID.
     */
    public boolean isOwnerById(String orgIdStr) {
        if (orgIdStr == null || orgIdStr.trim().isEmpty()) {
            return false;
        }

        try {
            UUID orgId = UUID.fromString(orgIdStr);
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !(auth.getPrincipal() instanceof Jwt)) {
                return false;
            }

            Jwt jwt = (Jwt) auth.getPrincipal();
            String issuer = jwt.getIssuer() != null ? jwt.getIssuer().toString() : "";

            // 1. VIP Bypass
            var realmAccess = jwt.getClaimAsMap("realm_access");
            if (realmAccess != null && realmAccess.containsKey("roles")) {
                @SuppressWarnings("unchecked")
                List<String> roles = (List<String>) realmAccess.get("roles");
                boolean isSuperAdmin = roles.stream().anyMatch(r -> r.equalsIgnoreCase("super_admin"));
                boolean isFromSystemRealm = issuer.contains("/realms/ftth-realm");

                if (isSuperAdmin && isFromSystemRealm) {
                    return true;
                }
            }

            // 2. DB Check
            String subject = jwt.getSubject();
            if (subject == null) return false;

            var userOpt = userRepository.findByIdWithOrganization(UUID.fromString(subject));
            if (userOpt.isPresent()) {
                var user = userOpt.get();
                Organization org = user.getOrganization();
                if (org != null && org.getId().equals(orgId)) {
                    return true;
                }
            }
        } catch (Exception e) {
            log.error("🛡️ TenantSecurity: Error verifying tenant ownership by ID: {}", e.getMessage(), e);
        }

        return false;
    }
}
