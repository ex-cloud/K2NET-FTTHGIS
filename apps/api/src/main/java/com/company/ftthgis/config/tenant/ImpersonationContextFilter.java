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

        // Terapkan override konteks tenant & audit dual-identity
        try {
            OrganizationContext.setOrganizationId(sessionCache.getTargetTenantId());
            AuditContext.setImpersonation(
                    sessionCache.getSessionId(),
                    sessionCache.getActorId(),
                    sessionCache.getTargetTenantId(),
                    sessionCache.getTargetTenantSlug()
            );

            log.debug("🛡️ [ImpersonationFilter] Konteks impersonasi diterapkan: actor={}, targetTenant={}",
                    sessionCache.getActorId(), sessionCache.getTargetTenantSlug());

            filterChain.doFilter(request, response);
        } finally {
            OrganizationContext.clear();
            AuditContext.clear();
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
