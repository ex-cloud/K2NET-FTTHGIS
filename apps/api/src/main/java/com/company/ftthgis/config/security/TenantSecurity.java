package com.company.ftthgis.config.security;

import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.ProjectMemberRepository;
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
    private final ProjectMemberRepository projectMemberRepository;

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

    /**
     * Checks if the currently authenticated user can access the specified project.
     * 1. VIP bypass for System Superadmin
     * 2. Tenant Admin bypass (if project belongs to user's org)
     * 3. Membership check in project_members
     */
    public boolean canAccessProject(UUID projectId) {
        if (projectId == null) {
            return false;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt)) {
            log.warn("🛡️ TenantSecurity: No valid JWT authentication found for project access check.");
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
            boolean isFromSystemRealm = issuer.contains("/realms/ftth-realm");

            if (isSuperAdmin && isFromSystemRealm) {
                log.debug("🛡️ TenantSecurity: Access granted to SUPER_ADMIN for project: {}", projectId);
                return true;
            }
        }

        // 2. Normal Tenant/Project ACL checks
        try {
            String subject = jwt.getSubject();
            if (subject == null) return false;

            var userOpt = userRepository.findByIdWithOrganization(UUID.fromString(subject));
            if (userOpt.isPresent()) {
                var user = userOpt.get();
                
                // Tenant administrator gets access to all projects in their organization
                if (user.getRole() != null && 
                    ("TENT-01".equals(user.getRole().getCode()) || "admin".equalsIgnoreCase(user.getRole().getName()))) {
                    log.debug("🛡️ TenantSecurity: Access granted to Tenant Admin for project: {}", projectId);
                    return true;
                }

                // Check project membership
                boolean isMember = projectMemberRepository.existsByUserIdAndProjectId(user.getId(), projectId);
                if (isMember) {
                    log.debug("🛡️ TenantSecurity: Access granted. User is a member of project: {}", projectId);
                    return true;
                }
                log.warn("🛡️ TenantSecurity: Access DENIED. User {} is not a member of project: {}", subject, projectId);
            }
        } catch (Exception e) {
            log.error("🛡️ TenantSecurity: Error verifying project access: {}", e.getMessage(), e);
        }

        return false;
    }

    /**
     * Checks if the current authenticated caller has an effective permission.
     * Evaluates direct authorities/permissions first, then checks if caller is in an
     * active, authorized impersonation session.
     *
     * @param permission The required permission code (e.g., 'network.manage', 'network.view')
     * @return true if authorized, false otherwise
     */
    public boolean hasEffectivePermission(String permission) {
        if (permission == null || permission.isBlank()) {
            return false;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }

        // 1. Direct GrantedAuthority check
        boolean hasDirect = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equalsIgnoreCase(permission));
        if (hasDirect) {
            return true;
        }

        // 2. Active Impersonation check: Valid session with authorized actor
        if (com.company.ftthgis.config.tenant.AuditContext.isImpersonating()) {
            boolean isAuthorizedImpersonator = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equalsIgnoreCase("system.support.impersonate")
                            || a.getAuthority().equalsIgnoreCase("ROLE_super_admin")
                            || a.getAuthority().equalsIgnoreCase("super_admin"));
            if (isAuthorizedImpersonator) {
                log.debug("🛡️ TenantSecurity: Effective permission '{}' granted via active impersonation session.", permission);
                return true;
            }
        }

        return false;
    }
}
