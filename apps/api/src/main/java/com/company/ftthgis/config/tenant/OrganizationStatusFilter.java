package com.company.ftthgis.config.tenant;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

/**
 * Enforcement Layer: Blocks access for SUSPENDED organizations.
 * Allows only read-only access to organization profile and billing endpoints.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrganizationStatusFilter extends OncePerRequestFilter {

    private final OrganizationRepository organizationRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        try {
            if (auth != null && auth.getPrincipal() instanceof Jwt) {
                Jwt jwt = (Jwt) auth.getPrincipal();
                String issuer = jwt.getIssuer().toString();
                
                // Extract slug from issuer (e.g., http://localhost:8081/realms/test -> test)
                String[] parts = issuer.split("/");
                String slug = parts[parts.length - 1];

                // Set organization context for default system realm or tenant realm
                if ("ftth-realm".equals(slug) || "master".equals(slug) || "default".equals(slug)) {
                    String tenantHeader = request.getHeader("X-Tenant-ID");
                    UUID tenantUuid = null;
                    if (tenantHeader != null && !tenantHeader.isBlank()) {
                        try {
                            tenantUuid = UUID.fromString(tenantHeader.trim());
                        } catch (IllegalArgumentException ignored) {}
                    }

                    if (tenantUuid != null) {
                        organizationRepository.findById(tenantUuid)
                                .ifPresent(org -> OrganizationContext.setOrganizationId(org.getId()));
                    }

                    if (OrganizationContext.getOrganizationId() == null) {
                        organizationRepository.findBySlug("default")
                                .or(() -> organizationRepository.findBySlug("system"))
                                .ifPresent(org -> OrganizationContext.setOrganizationId(org.getId()));
                    }
                } else {
                    Optional<Organization> orgOpt = resolveTenantOrganization(jwt, slug, request);
                    
                    if (orgOpt.isPresent()) {
                        Organization org = orgOpt.get();
                        OrganizationContext.setOrganizationId(org.getId());
                        
                        boolean isTrialExpired = org.isTrialExpired() || org.getStatus() == Organization.OrganizationStatus.TRIAL_EXPIRED;
                        boolean isSuspended = org.getStatus() == Organization.OrganizationStatus.SUSPENDED;
                        boolean isOverQuota = org.getStatus() == Organization.OrganizationStatus.OVER_QUOTA || Boolean.TRUE.equals(org.getOverQuotaMode());
                        
                        if (isTrialExpired || isSuspended || isOverQuota) {
                            String path = request.getRequestURI();
                            String method = request.getMethod();
                            String orgSlug = org.getSlug();
                            
                            // Define SAFE paths (Always accessible for subscription overview, billing, auth, profile)
                            boolean isSafePath = path.equals("/api/v1/organizations") || 
                                                 path.equals("/api/v1/organizations/" + orgSlug) ||
                                                 path.equals("/api/v1/organizations/" + orgSlug + "/subscription") ||
                                                 path.contains("/api/v1/users/me") ||
                                                 path.contains("/api/v1/billing") ||
                                                 path.contains("/api/v1/auth/logout");

                            boolean isSoftLocked = org.isSoftLocked() || isSuspended;

                            // If not soft-locked, allow read-only (GET) operations across entities (Grace Period)
                            if (!isSoftLocked && "GET".equalsIgnoreCase(method)) {
                                isSafePath = true;
                            }

                            // Profile, billing, and logout operations are always permitted
                            if (path.contains("/billing") || path.contains("/auth/logout") || path.contains("/users/me")) {
                                isSafePath = true;
                            }

                            if (!isSafePath) {
                                String errorCode;
                                String errorMessage;

                                if (isSuspended || (isTrialExpired && isSoftLocked)) {
                                    errorCode = isSuspended ? "ORGANIZATION_SUSPENDED" : "ORGANIZATION_TRIAL_EXPIRED";
                                    errorMessage = isSuspended
                                            ? "Organisasi Anda sedang ditangguhkan. Silakan lakukan pembayaran tagihan atau hubungi administrator."
                                            : "Masa uji coba (14 hari) dan grace period organisasi Anda telah berakhir. Akses telah dikunci. Silakan upgrade paket langganan Anda.";
                                } else if (isTrialExpired) {
                                    errorCode = "ORGANIZATION_TRIAL_EXPIRED";
                                    errorMessage = "Masa uji coba (14 hari) organisasi Anda telah berakhir (Read-Only Grace Period). Operasi penulisan dinonaktifkan. Silakan upgrade paket langganan.";
                                } else {
                                    errorCode = "ORGANIZATION_OVER_QUOTA";
                                    errorMessage = "Penggunaan resource organisasi Anda melebihi kuota paket (Read-Only Grace Period). Operasi penulisan dinonaktifkan. Silakan upgrade atau kurangi resource.";
                                }

                                log.warn("🛡️ ENFORCEMENT: Access blocked for org '{}' [{}] - Path: {} {}", orgSlug, errorCode, method, path);
                                
                                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                                response.setContentType("application/json;charset=UTF-8");
                                response.getWriter().write(String.format("{\"error\": \"%s\", \"message\": \"%s\"}", errorCode, errorMessage));
                                return;
                            }
                        }
                    }
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            OrganizationContext.clear();
        }
    }

    private Optional<Organization> resolveTenantOrganization(Jwt jwt, String realmSlug, HttpServletRequest request) {
        // 1. Primary 2-Realm Resolution: JWT claim organization_id / tenant_id (UUID)
        String orgIdClaim = jwt.getClaimAsString("organization_id");
        if (orgIdClaim == null || orgIdClaim.isBlank()) {
            orgIdClaim = jwt.getClaimAsString("tenant_id");
        }
        if (orgIdClaim != null && !orgIdClaim.isBlank() && !"00000000-0000-0000-0000-000000000000".equals(orgIdClaim)) {
            try {
                Optional<Organization> byId = organizationRepository.findById(UUID.fromString(orgIdClaim.trim()));
                if (byId.isPresent()) {
                    return byId;
                }
            } catch (IllegalArgumentException ignored) {}
        }

        // 2. Secondary 2-Realm Resolution: JWT claim tenant_slug
        String tenantSlugClaim = jwt.getClaimAsString("tenant_slug");
        if (tenantSlugClaim != null && !tenantSlugClaim.isBlank()) {
            Optional<Organization> bySlug = organizationRepository.findBySlug(tenantSlugClaim.trim().toLowerCase());
            if (bySlug.isPresent()) {
                return bySlug;
            }
        }

        // 3. Edge Gateway Header X-Tenant-ID (UUID or slug)
        String tenantHeader = request.getHeader("X-Tenant-ID");
        if (tenantHeader != null && !tenantHeader.isBlank() && !"00000000-0000-0000-0000-000000000000".equals(tenantHeader.trim())) {
            String clean = tenantHeader.trim();
            try {
                Optional<Organization> byHeaderId = organizationRepository.findById(UUID.fromString(clean));
                if (byHeaderId.isPresent()) {
                    return byHeaderId;
                }
            } catch (IllegalArgumentException ignored) {
                Optional<Organization> byHeaderSlug = organizationRepository.findBySlug(clean.toLowerCase());
                if (byHeaderSlug.isPresent()) {
                    return byHeaderSlug;
                }
            }
        }

        // 4. Legacy fallback ONLY when issuer realm is NOT the shared 'k2net-tenants' realm
        if (!KeycloakService.TENANT_SHARED_REALM.equalsIgnoreCase(realmSlug)) {
            return organizationRepository.findBySlug(realmSlug)
                    .or(() -> organizationRepository.findFirstByRealmKey(realmSlug));
        }

        return Optional.empty();
    }
}
