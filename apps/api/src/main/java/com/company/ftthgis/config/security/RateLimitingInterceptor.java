package com.company.ftthgis.config.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Rate Limiting Interceptor
 * 
 * Applies rate limiting to requests based on endpoint category and client IP/User.
 * Logs rate limit violations and returns 429 Too Many Requests when limit exceeded.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitingInterceptor implements HandlerInterceptor {

    private final RateLimitingConfiguration rateLimitingConfig;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (!rateLimitingConfig.isEnabled()) {
            return true;
        }

        String requestPath = request.getRequestURI();
        String clientId = getClientIdentifier(request);

        // Auth endpoints - most restrictive
        if (isAuthEndpoint(requestPath)) {
            if (!rateLimitingConfig.tryConsumeAuthToken(clientId)) {
                long retryAfter = rateLimitingConfig.getRemainingAuthTokens(clientId);
                response.setStatus(429); // Too Many Requests
                response.setHeader("Retry-After", String.valueOf(retryAfter));
                response.setHeader("X-RateLimit-Limit", "5");
                response.setHeader("X-RateLimit-Remaining", "0");
                response.setHeader("X-RateLimit-Reset", String.valueOf(System.currentTimeMillis() + (retryAfter * 1000)));
                response.getWriter().write("{\"error\": \"Rate limit exceeded. Too many authentication attempts. Please retry after " + retryAfter + " seconds.\"}");
                log.warn("🚫 Auth endpoint rate limit exceeded for client: {} path: {}", clientId, requestPath);
                return false;
            }
        }
        // Admin endpoints - moderate restriction
        else if (isAdminEndpoint(requestPath)) {
            if (!rateLimitingConfig.tryConsumeAdminToken(clientId)) {
                long retryAfter = rateLimitingConfig.getRemainingAdminTokens(clientId);
                response.setStatus(429);
                response.setHeader("Retry-After", String.valueOf(retryAfter));
                response.setHeader("X-RateLimit-Limit", "30");
                response.setHeader("X-RateLimit-Remaining", "0");
                response.getWriter().write("{\"error\": \"Rate limit exceeded. Please retry after " + retryAfter + " seconds.\"}");
                log.warn("🚫 Admin endpoint rate limit exceeded for client: {} path: {}", clientId, requestPath);
                return false;
            }
        }
        // Regular API endpoints - lenient
        else if (isApiEndpoint(requestPath)) {
            if (!rateLimitingConfig.tryConsumeApiToken(clientId)) {
                long retryAfter = rateLimitingConfig.getRemainingApiTokens(clientId);
                response.setStatus(429);
                response.setHeader("Retry-After", String.valueOf(retryAfter));
                response.setHeader("X-RateLimit-Limit", "100");
                response.setHeader("X-RateLimit-Remaining", "0");
                response.getWriter().write("{\"error\": \"Rate limit exceeded. Please retry after " + retryAfter + " seconds.\"}");
                log.warn("🚫 API endpoint rate limit exceeded for client: {} path: {}", clientId, requestPath);
                return false;
            }
        }

        return true;
    }

    /**
     * Get unique client identifier (IP or User)
     * Prefers authenticated user ID, falls back to IP address
     */
    private String getClientIdentifier(HttpServletRequest request) {
        // Try to get authenticated user ID from security context
        try {
            String userId = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
            if (userId != null && !userId.isEmpty()) {
                return "user:" + userId;
            }
        } catch (Exception e) {
            log.debug("Could not extract user from principal", e);
        }

        // Fall back to IP address
        String clientIp = getClientIp(request);
        return "ip:" + clientIp;
    }

    /**
     * Extract client IP address from request
     * Handles proxy headers (X-Forwarded-For, X-Real-IP)
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    /**
     * Check if path is auth endpoint
     */
    private boolean isAuthEndpoint(String path) {
        return path.contains("/auth") || 
               path.contains("/login") || 
               path.contains("/password-reset") ||
               path.contains("/oauth") ||
               path.contains("/token");
    }

    /**
     * Check if path is admin endpoint
     */
    private boolean isAdminEndpoint(String path) {
        return path.contains("/admin") || 
               path.contains("/system") ||
               path.contains("/security") ||
               path.contains("/roles") ||
               path.contains("/users/manage");
    }

    /**
     * Check if path is API endpoint
     */
    private boolean isApiEndpoint(String path) {
        return path.startsWith("/api/");
    }
}
