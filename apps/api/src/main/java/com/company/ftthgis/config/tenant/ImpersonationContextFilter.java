package com.company.ftthgis.config.tenant;

import com.company.ftthgis.domain.tenant.dto.ImpersonationSessionCache;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class ImpersonationContextFilter extends OncePerRequestFilter {

    private static final String SESSION_CACHE_PREFIX = "impersonation:session:";
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final com.company.ftthgis.domain.user.repository.PermissionRepository permissionRepository;

    private final java.util.concurrent.atomic.AtomicReference<java.util.List<String>> cachedTenantPermissions = new java.util.concurrent.atomic.AtomicReference<>();
    private volatile long lastCacheRefreshEpoch = 0L;
    private static final long CACHE_TTL_MS = 60_000L;

    private java.util.List<String> getTenantPermissions() {
        long now = System.currentTimeMillis();
        java.util.List<String> cached = cachedTenantPermissions.get();
        if (cached == null || (now - lastCacheRefreshEpoch > CACHE_TTL_MS)) {
            try {
                java.util.List<String> fresh = permissionRepository.findByScopeIgnoreCase("TENANT").stream()
                        .map(com.company.ftthgis.domain.user.entity.Permission::getCode)
                        .filter(code -> code != null && !code.isBlank())
                        .distinct()
                        .toList();
                if (!fresh.isEmpty()) {
                    cachedTenantPermissions.set(fresh);
                    lastCacheRefreshEpoch = now;
                    return fresh;
                }
            } catch (Exception e) {
                log.warn("🛡️ [ImpersonationFilter] Gagal mengambil daftar permission tenant dari DB: {}", e.getMessage());
            }
        }
        return cached != null ? cached : java.util.Collections.emptyList();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/v1/system/impersonate/") ||
               path.startsWith("/api/v1/auth/") ||
               path.startsWith("/actuator/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String sessionIdHeader = request.getHeader("X-Impersonation-Session-Id");

        // Jika header tidak ada, lanjutkan filter chain normal
        if (sessionIdHeader == null || sessionIdHeader.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Validasi sintaks UUID
        UUID sessionId;
        try {
            sessionId = UUID.fromString(sessionIdHeader.trim());
        } catch (IllegalArgumentException e) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Format ID sesi impersonasi tidak valid.");
            return;
        }

        // Lookup di Redis
        Object cached = redisTemplate.opsForValue().get(SESSION_CACHE_PREFIX + sessionId);
        if (cached == null) {
            log.warn("🛡️ [ImpersonationFilter] Sesi impersonasi tidak ditemukan atau telah kedaluwarsa di Redis: {}", sessionId);
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "Sesi impersonasi telah kedaluwarsa atau tidak valid. Silakan mulai sesi baru.");
            return;
        }

        ImpersonationSessionCache sessionCache = objectMapper.convertValue(cached, ImpersonationSessionCache.class);

        // Validasi kecocokan aktor dengan caller JWT
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            String callerSub = jwt.getSubject();
            if (!sessionCache.getActorId().toString().equalsIgnoreCase(callerSub)) {
                log.warn("🛡️ [ImpersonationFilter] Mismatch actor ID: caller={}, sessionActor={}",
                        callerSub, sessionCache.getActorId());
                sendError(response, HttpServletResponse.SC_FORBIDDEN,
                        "Sesi impersonasi ini bukan milik akun Anda.");
                return;
            }
        }

        // Terapkan override konteks tenant & audit dual-identity serta enrichment permissions
        Authentication originalAuth = SecurityContextHolder.getContext().getAuthentication();
        try {
            OrganizationContext.setOrganizationId(sessionCache.getTargetTenantId());
            AuditContext.setImpersonation(
                    sessionCache.getSessionId(),
                    sessionCache.getActorId(),
                    sessionCache.getTargetTenantId(),
                    sessionCache.getTargetTenantSlug()
            );

            // Authority Enrichment: Memberikan permission operasional tenant ke sesi impersonator yang sah
            if (originalAuth instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwtAuth) {
                java.util.Set<org.springframework.security.core.GrantedAuthority> enrichedAuthorities = new java.util.HashSet<>(jwtAuth.getAuthorities());
                for (String perm : getTenantPermissions()) {
                    enrichedAuthorities.add(new org.springframework.security.core.authority.SimpleGrantedAuthority(perm));
                }

                org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken enrichedAuth = 
                        new org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken(
                                jwtAuth.getToken(),
                                enrichedAuthorities,
                                jwtAuth.getName()
                        );
                SecurityContextHolder.getContext().setAuthentication(enrichedAuth);
            }

            log.debug("🛡️ [ImpersonationFilter] Konteks impersonasi diterapkan: actor={}, targetTenant={}",
                    sessionCache.getActorId(), sessionCache.getTargetTenantSlug());

            filterChain.doFilter(request, response);
        } finally {
            OrganizationContext.clear();
            AuditContext.clear();
            SecurityContextHolder.getContext().setAuthentication(originalAuth);
        }
    }

    private void sendError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String json = String.format(
                "{\"timestamp\":\"%s\",\"status\":%d,\"error\":\"%s\",\"message\":\"%s\"}",
                LocalDateTime.now(), status, status == 401 ? "Unauthorized" : "Forbidden", message
        );
        response.getWriter().write(json);
    }
}
