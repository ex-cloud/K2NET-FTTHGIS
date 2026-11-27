package com.company.ftthgis.config.security;

import com.company.ftthgis.config.tenant.AuditContext;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantSecurityPolicy;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.TenantSecurityPolicyRepository;
import com.company.ftthgis.service.AuditLoggingService;
import com.company.ftthgis.service.SystemSettingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Layer-2 Defense-in-Depth Filter enforcing tenant IP Allowlist & Country Geofencing
 * on active Bearer JWT REST API requests (ADR-0032 / BUG-GEO-03).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TenantIpPolicyFilter extends OncePerRequestFilter {

    private static final long CACHE_TTL_MS = 15_000L;
    private static final long AUDIT_THROTTLE_MS = 60_000L;
    private static final ObjectMapper JSON_MAPPER = new ObjectMapper();

    private final OrganizationRepository organizationRepository;
    private final TenantSecurityPolicyRepository tenantPolicyRepository;
    private final SystemSettingService settingService;
    private final AuditLoggingService auditLoggingService;

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    private final ConcurrentHashMap<String, PolicySnapshot> policyCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> auditThrottleMap = new ConcurrentHashMap<>();

    private volatile Boolean cachedPlatformAllowed;
    private volatile long platformCachedAtMs = 0L;

    public void evictTenant(UUID orgId, String slug) {
        if (orgId != null) {
            policyCache.remove("id:" + orgId);
        }
        if (slug != null && !slug.isBlank()) {
            policyCache.remove("slug:" + slug.trim().toLowerCase(Locale.ROOT));
        }
    }

    public void evictPlatformFlag() {
        cachedPlatformAllowed = null;
        platformCachedAtMs = 0L;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null) {
            return true;
        }
        return path.startsWith("/api/v1/scim/")
                || path.startsWith("/api/v1/internal/")
                || path.startsWith("/api/v1/auth/")
                || path.startsWith("/api/v1/public/")
                || path.startsWith("/api/v1/system/")
                || path.startsWith("/actuator/")
                || path.startsWith("/uploads/")
                || path.startsWith("/error")
                || path.equals("/api/v1/payments/callback")
                || path.equals("/api/payments/callback")
                || path.equals("/api/github/webhook");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        if (AuditContext.isImpersonating()) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof Jwt jwt)) {
            filterChain.doFilter(request, response);
            return;
        }

        String issuer = jwt.getIssuer() != null ? jwt.getIssuer().toString() : "";
        if (issuer.endsWith("/realms/ftth-realm")) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!isPlatformIpAllowlistAllowed()) {
            filterChain.doFilter(request, response);
            return;
        }

        PolicySnapshot snapshot = resolvePolicyForRequest(jwt, request);
        if (snapshot == null || "DISABLED".equalsIgnoreCase(snapshot.mode())) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean hasCidr = snapshot.cidrs() != null && !snapshot.cidrs().isBlank();
        boolean hasCountries = snapshot.countries() != null && !snapshot.countries().isEmpty();
        if (!hasCidr && !hasCountries) {
            filterChain.doFilter(request, response);
            return;
        }

        if (snapshot.allowBreakGlassBypass() && isActiveBreakGlassSession(jwt.getSubject())) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = ClientIpResolver.resolveClientIp(request);
        String country = ClientIpResolver.resolveCountryCode(request);
        ClientIpResolver.PolicyDecision decision = ClientIpResolver.evaluateAndPolicy(
                clientIp, country, snapshot.cidrs(), snapshot.countries()
        );

        if (decision.allowed()) {
            filterChain.doFilter(request, response);
            return;
        }

        String actor = resolveActor(jwt);
        if ("MONITOR_ONLY".equalsIgnoreCase(snapshot.mode())) {
            response.setHeader("X-K2NET-IP-Policy-Shadow", "WOULD_BLOCK");
            emitThrottledAudit(
                    snapshot.slug(),
                    "SECURITY_IP_POLICY_SHADOW_HIT",
                    "WARNING",
                    actor,
                    clientIp,
                    country,
                    decision.reason(),
                    request.getRequestURI()
            );
            filterChain.doFilter(request, response);
            return;
        }

        emitThrottledAudit(
                snapshot.slug(),
                "SECURITY_IP_POLICY_BLOCKED",
                "CRITICAL",
                actor,
                clientIp,
                country,
                decision.reason(),
                request.getRequestURI()
        );

        log.warn("🛡️ [TenantIpPolicyFilter] Blocked request for org '{}' from ip={} country={} reason={} uri={}",
                snapshot.slug(), clientIp, country, decision.reason(), request.getRequestURI());

        writeBlockedResponse(response, decision.reason(), clientIp, country);
    }

    private boolean isPlatformIpAllowlistAllowed() {
        long now = System.currentTimeMillis();
        Boolean cached = cachedPlatformAllowed;
        if (cached != null && (now - platformCachedAtMs) < CACHE_TTL_MS) {
            return cached;
        }
        boolean allowed = true;
        try {
            allowed = settingService.getSettingBoolean("security.ip_allowlist.tenant_allowed", true);
        } catch (Exception ignored) {}
        cachedPlatformAllowed = allowed;
        platformCachedAtMs = now;
        return allowed;
    }

    private PolicySnapshot resolvePolicyForRequest(Jwt jwt, HttpServletRequest request) {
        String slug = jwt.getClaimAsString("tenant_slug");
        if (slug == null || slug.isBlank()) {
            slug = request.getHeader("X-Tenant-Slug");
        }
        if (slug != null && !slug.isBlank()) {
            String cleanSlug = slug.trim().toLowerCase(Locale.ROOT);
            String key = "slug:" + cleanSlug;
            PolicySnapshot cached = policyCache.get(key);
            if (cached != null && (System.currentTimeMillis() - cached.cachedAtMs()) < CACHE_TTL_MS) {
                return cached;
            }
            Optional<Organization> orgOpt = organizationRepository.findBySlug(cleanSlug);
            if (orgOpt.isPresent()) {
                return loadAndCacheSnapshot(orgOpt.get());
            }
        }

        String orgIdRaw = jwt.getClaimAsString("organization_id");
        if (orgIdRaw == null || orgIdRaw.isBlank()) {
            orgIdRaw = jwt.getClaimAsString("tenant_id");
        }
        if (orgIdRaw != null && !orgIdRaw.isBlank()) {
            try {
                UUID orgId = UUID.fromString(orgIdRaw.trim());
                String key = "id:" + orgId;
                PolicySnapshot cached = policyCache.get(key);
                if (cached != null && (System.currentTimeMillis() - cached.cachedAtMs()) < CACHE_TTL_MS) {
                    return cached;
                }
                Optional<Organization> orgOpt = organizationRepository.findById(orgId);
                if (orgOpt.isPresent()) {
                    return loadAndCacheSnapshot(orgOpt.get());
                }
            } catch (IllegalArgumentException ignored) {}
        }

        return null;
    }

    private PolicySnapshot loadAndCacheSnapshot(Organization org) {
        TenantSecurityPolicy policy = tenantPolicyRepository.findByOrganizationIdNative(org.getId()).orElse(null);
        long now = System.currentTimeMillis();
        String mode = "ENFORCE";
        String cidrs = null;
        List<String> countries = List.of();
        boolean breakGlassBypass = true;
        if (policy != null) {
            mode = (policy.getIpPolicyMode() != null && !policy.getIpPolicyMode().isBlank())
                    ? policy.getIpPolicyMode().trim().toUpperCase(Locale.ROOT)
                    : "ENFORCE";
            cidrs = policy.getIpAllowlistCidrs();
            countries = ClientIpResolver.parseCountriesCsv(policy.getAllowedCountries());
            breakGlassBypass = policy.isAllowBreakGlassIpBypass();
        }
        PolicySnapshot snapshot = new PolicySnapshot(
                org.getId(),
                org.getSlug(),
                mode,
                cidrs,
                countries,
                breakGlassBypass,
                now
        );
        policyCache.put("id:" + org.getId(), snapshot);
        if (org.getSlug() != null) {
            policyCache.put("slug:" + org.getSlug().trim().toLowerCase(Locale.ROOT), snapshot);
        }
        return snapshot;
    }

    private boolean isActiveBreakGlassSession(String userSub) {
        if (redisTemplate == null || userSub == null || userSub.isBlank()) {
            return false;
        }
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey("auth:break-glass-exp:" + userSub.trim()));
        } catch (Exception e) {
            return false;
        }
    }

    private void emitThrottledAudit(
            String tenantSlug,
            String action,
            String severity,
            String actor,
            String clientIp,
            String country,
            String reason,
            String uri) {
        long now = System.currentTimeMillis();
        String throttleKey = tenantSlug + "|" + action + "|" + (clientIp != null ? clientIp : "unknown");
        Long last = auditThrottleMap.get(throttleKey);
        if (last != null && (now - last) < AUDIT_THROTTLE_MS) {
            return;
        }
        if (auditThrottleMap.size() > 2000) {
            auditThrottleMap.clear();
        }
        auditThrottleMap.put(throttleKey, now);

        try {
            Map<String, Object> meta = new LinkedHashMap<>();
            meta.put("severity", severity);
            meta.put("actor", actor);
            meta.put("clientIP", clientIp != null ? clientIp : "unknown");
            meta.put("country", country != null ? country : "");
            meta.put("reason", reason);
            meta.put("layer", "backend_api_filter");
            meta.put("uri", uri != null ? uri : "");
            auditLoggingService.logEvent(
                    tenantSlug,
                    action,
                    "TENANT_IP_POLICY",
                    tenantSlug,
                    Map.of(),
                    Map.of("reason", reason, "clientIP", clientIp != null ? clientIp : "unknown"),
                    meta
            );
        } catch (Exception ignored) {}
    }

    private String resolveActor(Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        return (email != null && !email.isBlank()) ? email : jwt.getSubject();
    }

    private void writeBlockedResponse(
            HttpServletResponse response,
            String reason,
            String clientIp,
            String country) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String msg = "country_not_allowed".equals(reason)
                ? "Akses API ditolak: Negara asal koneksi perangkat Anda tidak termasuk dalam daftar geofencing organisasi."
                : "Akses API ditolak: Alamat IP perangkat Anda tidak terdaftar dalam IP Allowlist organisasi.";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", 403);
        body.put("error", "IP_POLICY_BLOCKED");
        body.put("code", "TENANT_IP_GEOFENCE_DENIED");
        body.put("reason", reason);
        body.put("clientIp", clientIp != null ? clientIp : "");
        body.put("country", country != null ? country : "");
        body.put("message", msg);
        response.getWriter().write(JSON_MAPPER.writeValueAsString(body));
    }

    private record PolicySnapshot(
            UUID orgId,
            String slug,
            String mode,
            String cidrs,
            List<String> countries,
            boolean allowBreakGlassBypass,
            long cachedAtMs
    ) {}
}
