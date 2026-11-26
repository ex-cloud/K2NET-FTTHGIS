package com.company.ftthgis.config.security;

import com.company.ftthgis.api.tenant.dto.LicenseEntitlementsDto;
import com.company.ftthgis.config.tenant.OrganizationContext;
import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationScimToken;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.domain.tenant.repository.OrganizationScimTokenRepository;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import com.company.ftthgis.service.LicenseManagementService;
import com.company.ftthgis.util.SecretEncryptionUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Enterprise SCIM 2.0 Bearer Token Authentication Filter (RFC 7644 / ADR-0029).
 *
 * <p>Intercepts {@code /api/v1/scim/v2/{orgSlug}/...} requests, validates SHA-256 hashed
 * {@code k2_scim_...} bearer tokens with constant-time comparison, enforces strict
 * tenant slug binding (anti cross-tenant replay), organization ACTIVE status, and
 * Enterprise SSO license entitlement.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ScimTokenAuthenticationFilter extends OncePerRequestFilter {

    public static final String SCIM_PATH_PREFIX = "/api/v1/scim/v2/";
    public static final String SCIM_TOKEN_PREFIX = "k2_scim_";
    private static final String SCIM_CONTENT_TYPE = "application/scim+json;charset=UTF-8";
    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS");

    private final OrganizationScimTokenRepository scimTokenRepository;
    private final TenantLicenseRepository tenantLicenseRepository;
    @Lazy
    private final LicenseManagementService licenseManagementService;
    private final SecretEncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri == null || !uri.startsWith(SCIM_PATH_PREFIX);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String token = extractBearerToken(request);
        if (token == null || !token.startsWith(SCIM_TOKEN_PREFIX)) {
            writeScimError(response, HttpStatus.UNAUTHORIZED, null,
                    "Valid SCIM Bearer token (k2_scim_...) is required.");
            return;
        }

        String computedHash = encryptionUtil.sha256Hex(token);
        Optional<OrganizationScimToken> tokenOpt = scimTokenRepository.findByTokenHashWithOrganization(computedHash);
        if (tokenOpt.isEmpty()) {
            writeScimError(response, HttpStatus.UNAUTHORIZED, null, "Invalid SCIM Bearer token.");
            return;
        }

        OrganizationScimToken scimToken = tokenOpt.get();
        if (scimToken.getTokenHash() == null || !MessageDigest.isEqual(
                scimToken.getTokenHash().getBytes(StandardCharsets.UTF_8),
                computedHash.getBytes(StandardCharsets.UTF_8))) {
            writeScimError(response, HttpStatus.UNAUTHORIZED, null, "Invalid SCIM Bearer token.");
            return;
        }

        if (!scimToken.isActive() || scimToken.getRevokedAt() != null) {
            writeScimError(response, HttpStatus.UNAUTHORIZED, null, "SCIM Bearer token has been revoked.");
            return;
        }

        OffsetDateTime now = OffsetDateTime.now();
        if (scimToken.getExpiresAt() != null && scimToken.getExpiresAt().isBefore(now)) {
            writeScimError(response, HttpStatus.UNAUTHORIZED, null, "SCIM Bearer token has expired.");
            return;
        }

        Organization org = scimToken.getOrganization();
        if (org == null || org.getDeletedAt() != null) {
            writeScimError(response, HttpStatus.FORBIDDEN, null, "Organization does not exist or has been deleted.");
            return;
        }

        // Strict tenant boundary check: token MUST match {orgSlug} in request path
        String pathSlug = extractOrgSlugFromPath(request.getRequestURI());
        if (pathSlug == null || !pathSlug.equalsIgnoreCase(org.getSlug())) {
            log.warn("🚨 SCIM cross-tenant replay blocked: token org='{}', requested pathSlug='{}'",
                    org.getSlug(), pathSlug);
            writeScimError(response, HttpStatus.FORBIDDEN, null,
                    "SCIM Bearer token is not authorized for the requested organization.");
            return;
        }

        if (org.getStatus() != Organization.OrganizationStatus.ACTIVE) {
            writeScimError(response, HttpStatus.FORBIDDEN, null,
                    "Organization is currently not active (status: " + org.getStatus() + ").");
            return;
        }

        // Verify Enterprise SSO entitlement & active license write permissions
        LicenseEntitlementsDto entitlements = licenseManagementService.getEffectiveLicenseEntitlements(org.getId());
        if (entitlements == null || !entitlements.isSsoEnabled()) {
            writeScimError(response, HttpStatus.FORBIDDEN, null,
                    "Enterprise SCIM 2.0 requires an active Enterprise plan or SSO entitlement.");
            return;
        }

        String method = request.getMethod() != null ? request.getMethod().toUpperCase(Locale.ROOT) : "GET";
        if (!SAFE_METHODS.contains(method)) {
            Optional<TenantLicense> licOpt = tenantLicenseRepository
                    .findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(org.getId(), LicenseStatus.ACTIVE);
            if (licOpt.isEmpty()) {
                licOpt = tenantLicenseRepository.findFirstByOrganizationIdOrderByCreatedAtDesc(org.getId());
            }
            if (licOpt.isPresent()) {
                LicenseStatus st = licOpt.get().getStatus();
                if (st == LicenseStatus.RESTRICTED_READ_ONLY || st == LicenseStatus.SUSPENDED || st == LicenseStatus.REVOKED) {
                    writeScimError(response, HttpStatus.FORBIDDEN, null,
                            "Organization license status (" + st.name() + ") prohibits SCIM provisioning writes.");
                    return;
                }
            }
        }

        try {
            scimToken.setLastUsedAt(now);
            scimToken.setLastUsedIp(resolveClientIp(request));
            scimTokenRepository.save(scimToken);
        } catch (Exception e) {
            log.debug("Could not update lastUsedAt for SCIM token {}: {}", scimToken.getId(), e.getMessage());
        }

        ScimPrincipal principal = new ScimPrincipal(
                scimToken.getId(),
                org.getId(),
                org.getSlug(),
                scimToken.getName()
        );
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(
                        new SimpleGrantedAuthority("ROLE_SCIM_PROVISIONER"),
                        new SimpleGrantedAuthority("scim.provision")
                )
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
        OrganizationContext.setOrganizationId(org.getId());

        try {
            filterChain.doFilter(request, response);
        } finally {
            OrganizationContext.clear();
            SecurityContextHolder.clearContext();
        }
    }

    private String extractBearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.length() > 7
                && authHeader.substring(0, 7).equalsIgnoreCase("Bearer ")) {
            String trimmed = authHeader.substring(7).trim();
            return trimmed.isEmpty() ? null : trimmed;
        }
        return null;
    }

    private String extractOrgSlugFromPath(String uri) {
        if (uri == null || !uri.startsWith(SCIM_PATH_PREFIX)) {
            return null;
        }
        String remainder = uri.substring(SCIM_PATH_PREFIX.length());
        int slashIdx = remainder.indexOf('/');
        String slug = slashIdx >= 0 ? remainder.substring(0, slashIdx) : remainder;
        return slug.isBlank() ? null : slug.trim();
    }

    private String resolveClientIp(HttpServletRequest request) {
        String cfIp = request.getHeader("CF-Connecting-IP");
        if (cfIp != null && !cfIp.isBlank()) {
            return cfIp.trim();
        }
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void writeScimError(
            HttpServletResponse response,
            HttpStatus status,
            String scimType,
            String detail
    ) throws IOException {
        response.setStatus(status.value());
        response.setContentType(SCIM_CONTENT_TYPE);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("schemas", List.of("urn:ietf:params:scim:api:messages:2.0:Error"));
        body.put("status", String.valueOf(status.value()));
        if (scimType != null && !scimType.isBlank()) {
            body.put("scimType", scimType);
        }
        body.put("detail", detail);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
