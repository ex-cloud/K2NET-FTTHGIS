package com.company.ftthgis.config.security;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate Limiting Filter with Granular Control
 * 
 * Implements token bucket algorithm via Bucket4j with different limits for:
 * - Authentication endpoints (5 req/min) - protect against brute force
 * - Admin endpoints (30 req/min) - prevent admin abuse
 * - API endpoints (100 req/min) - standard usage
 * 
 * In-memory caching used; for production at scale use Redis backend.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitingFilter implements Filter {

    private final RateLimitingConfiguration rateLimitingConfig;
    private final com.company.ftthgis.service.AuditLoggingService auditLoggingService;

    @Value("${app.rate-limiting.enabled:true}")
    private boolean rateLimitingEnabled;

    // Legacy fallback buckets (deprecated, using RateLimitingConfiguration instead)
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Deprecated
    private Bucket createNewBucket() {
        return Bucket.builder()
                .addLimit(limit -> limit.capacity(100).refillGreedy(100, Duration.ofMinutes(1)))
                .build();
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        if (!rateLimitingEnabled) {
            chain.doFilter(request, response);
            return;
        }

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String uri = httpRequest.getRequestURI();
        String clientId = getClientIdentifier(httpRequest);

        // Skip rate limiting for non-API, SSE, telemetry polling, device trust verification, internal mesh, and health checks
        String gatewayTokenHeader = httpRequest.getHeader("X-Gateway-Token");
        if (!uri.startsWith("/api/") || 
            gatewayTokenHeader != null ||
            uri.endsWith("/map-updates") || 
            uri.contains("/security/device/") || 
            uri.contains("/actuator/") ||
            uri.contains("/system/devops-stats") ||
            uri.contains("/system/keycloak/") ||
            uri.contains("/system/db-observability") ||
            uri.contains("/system/health-metrics") ||
            uri.contains("/system/gateway-status")) {
            chain.doFilter(request, response);
            return;
        }

        // Apply granular rate limiting based on endpoint type
        boolean allowed = true;
        int limit = 300;
        
        if (isAuthEndpoint(uri)) {
            allowed = rateLimitingConfig.tryConsumeAuthToken(clientId);
            limit = 20;
        } else if (isAdminEndpoint(uri)) {
            allowed = rateLimitingConfig.tryConsumeAdminToken(clientId);
            limit = 300;
        } else if (isApiEndpoint(uri)) {
            allowed = rateLimitingConfig.tryConsumeApiToken(clientId);
            limit = 300;
        }

        if (allowed) {
            httpResponse.addHeader("X-Rate-Limit-Limit", String.valueOf(limit));
            chain.doFilter(request, response);
        } else {
            // Rate limit exceeded
            log.warn("🚫 Rate limit exceeded for client: {} on URI: {}", clientId, uri);
            // Record audit log for rate limit violation
            try {
                auditLoggingService.logRateLimitExceeded(clientId, getClientIP(httpRequest), httpRequest.getMethod(), uri, "Rate limit exceeded for client");
            } catch (Exception e) {
                log.debug("Failed to log rate limit event", e);
            }
            httpResponse.setStatus(429); // Too Many Requests
            httpResponse.setHeader("Retry-After", "60");
            httpResponse.setHeader("X-Rate-Limit-Limit", String.valueOf(limit));
            httpResponse.setHeader("X-Rate-Limit-Remaining", "0");
            httpResponse.setContentType("application/json");
            httpResponse.getWriter().write("{\"error\": \"Too many requests\", \"message\": \"Rate limit exceeded. Please retry after 60 seconds.\"}");
        }
    }

    /**
     * Get unique client identifier (User ID or IP)
     */
    private String getClientIdentifier(HttpServletRequest request) {
        try {
            String userId = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
            if (userId != null && !userId.isEmpty()) {
                return "user:" + userId;
            }
        } catch (Exception e) {
            log.debug("Could not extract user from principal", e);
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return "token:" + Integer.toHexString(authHeader.hashCode());
        }

        return "ip:" + getClientIP(request);
    }

    /**
     * Extract client IP address (handles proxy headers)
     */
    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0].trim();
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
               path.contains("/oauth");
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
