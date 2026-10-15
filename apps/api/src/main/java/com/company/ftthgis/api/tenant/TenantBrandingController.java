package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.tenant.dto.TenantBrandingDto;
import com.company.ftthgis.api.tenant.dto.UpdateTenantBrandingRequest;
import com.company.ftthgis.api.tenant.dto.VerifyDnsResponse;
import com.company.ftthgis.config.tenant.OrganizationContext;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.TenantBrandingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TenantBrandingController {

    private final TenantBrandingService tenantBrandingService;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    /**
     * Mengambil konfigurasi branding dan domain kustom untuk organisasi saat ini.
     */
    @GetMapping("/api/v1/tenant/branding")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('feature.branding.whitelabel') or @tenantSecurity.hasEffectiveFeature('feature.branding.whitelabel') or hasAuthority('feature.branding.whitelabel') or hasAuthority('system.organizations.manage') or hasAuthority('organizations.view')")
    public ResponseEntity<TenantBrandingDto> getTenantBranding(
            @RequestParam(value = "slug", required = false) String slugParam
    ) {
        UUID orgId = resolveOrganizationId(slugParam);
        return ResponseEntity.ok(tenantBrandingService.getBranding(orgId));
    }

    /**
     * Memperbarui logo, nama aplikasi, warna tema, dan domain kustom.
     */
    @PutMapping("/api/v1/tenant/branding")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('feature.branding.whitelabel') or @tenantSecurity.hasEffectiveFeature('feature.branding.whitelabel') or hasAuthority('feature.branding.whitelabel') or hasAuthority('system.organizations.manage')")
    public ResponseEntity<TenantBrandingDto> updateTenantBranding(
            @RequestParam(value = "slug", required = false) String slugParam,
            @Valid @RequestBody UpdateTenantBrandingRequest request
    ) {
        UUID orgId = resolveOrganizationId(slugParam);
        String currentUser = resolveCurrentUserIdentifier();
        return ResponseEntity.ok(tenantBrandingService.updateBranding(orgId, request, currentUser));
    }

    /**
     * Memvalidasi CNAME DNS record domain kustom tenant.
     */
    @PostMapping("/api/v1/tenant/branding/verify-dns")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('feature.branding.whitelabel') or @tenantSecurity.hasEffectiveFeature('feature.branding.whitelabel') or hasAuthority('feature.branding.whitelabel') or hasAuthority('system.organizations.manage')")
    public ResponseEntity<VerifyDnsResponse> verifyCustomDomainDns(
            @RequestParam(value = "slug", required = false) String slugParam
    ) {
        UUID orgId = resolveOrganizationId(slugParam);
        return ResponseEntity.ok(tenantBrandingService.verifyDns(orgId));
    }

    /**
     * Endpoint publik untuk memuat identitas branding portal berdasarkan Host domain (misal gis.myisp.net).
     */
    @GetMapping("/api/v1/public/organizations/branding/resolve")
    @PreAuthorize("permitAll()")
    public ResponseEntity<TenantBrandingDto> resolveBrandingPublic(
            @RequestParam("domain") String domain
    ) {
        return tenantBrandingService.resolveBrandingByDomain(domain)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private UUID resolveOrganizationId(String slugParam) {
        // 1. Prioritas Super Admin / Impersonation dengan slug eksplisit
        if (slugParam != null && !slugParam.isBlank()) {
            Optional<Organization> bySlug = organizationRepository.findBySlug(slugParam.trim());
            if (bySlug.isPresent()) {
                OrganizationContext.setOrganizationId(bySlug.get().getId());
                return bySlug.get().getId();
            }
        }

        // 2. ThreadLocal OrganizationContext
        UUID contextId = OrganizationContext.getOrganizationId();
        if (contextId != null && !"00000000-0000-0000-0000-000000000000".equals(contextId.toString())) {
            return contextId;
        }

        // 3. JWT Claims
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            String orgClaim = jwt.getClaimAsString("organization_id");
            if (orgClaim == null) orgClaim = jwt.getClaimAsString("tenant_id");
            if (orgClaim != null && !orgClaim.isBlank() && !"00000000-0000-0000-0000-000000000000".equals(orgClaim)) {
                try {
                    UUID resolved = UUID.fromString(orgClaim);
                    OrganizationContext.setOrganizationId(resolved);
                    return resolved;
                } catch (IllegalArgumentException ignored) {}
            }

            // Keycloak realm slug fallback
            String issuer = jwt.getIssuer() != null ? jwt.getIssuer().toString() : "";
            if (issuer.contains("/realms/")) {
                String[] parts = issuer.split("/");
                String realmSlug = parts[parts.length - 1];
                if (!"ftth-realm".equals(realmSlug) && !"master".equals(realmSlug)) {
                    var orgOpt = organizationRepository.findBySlug(realmSlug)
                            .or(() -> organizationRepository.findByRealmKey(realmSlug));
                    if (orgOpt.isPresent()) {
                        UUID id = orgOpt.get().getId();
                        OrganizationContext.setOrganizationId(id);
                        return id;
                    }
                }
            }

            // Email user lookup fallback
            String email = jwt.getClaimAsString("email");
            if (email != null && !email.isBlank()) {
                var userOpt = userRepository.findByEmail(email.trim().toLowerCase(java.util.Locale.ROOT));
                if (userOpt.isPresent() && userOpt.get().getOrganization() != null) {
                    UUID id = userOpt.get().getOrganization().getId();
                    OrganizationContext.setOrganizationId(id);
                    return id;
                }
            }

            // Subject user lookup
            String subject = jwt.getSubject();
            if (subject != null) {
                try {
                    UUID userOrgId = userRepository.findByIdWithOrganization(UUID.fromString(subject))
                            .map(u -> u.getOrganization() != null ? u.getOrganization().getId() : null)
                            .orElse(null);
                    if (userOrgId != null) {
                        OrganizationContext.setOrganizationId(userOrgId);
                        return userOrgId;
                    }
                } catch (IllegalArgumentException ignored) {}
            }
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organisasi tenant tidak ditemukan pada konteks otentikasi.");
    }

    private String resolveCurrentUserIdentifier() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            if (email != null && !email.isBlank()) return email;
            String user = jwt.getClaimAsString("preferred_username");
            if (user != null && !user.isBlank()) return user;
            String sub = jwt.getSubject();
            if (sub != null && !sub.isBlank()) return sub;
        }
        if (auth != null && auth.getName() != null && !auth.getName().isBlank()) {
            return auth.getName();
        }
        return "TENANT_ADMIN";
    }
}
