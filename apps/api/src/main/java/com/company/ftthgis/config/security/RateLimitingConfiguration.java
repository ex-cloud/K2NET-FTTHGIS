package com.company.ftthgis.config.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate Limiting Configuration using Bucket4j Token Bucket Algorithm
 * 
 * Provides different rate limit configurations for different endpoint categories:
 * - Authentication endpoints: More restrictive (prevent brute force)
 * - Admin endpoints: Moderate (prevent abuse)
 * - API endpoints: Lenient (normal usage)
 */
@Configuration
@Slf4j
public class RateLimitingConfiguration {

    @Value("${app.rate-limiting.auth.requests-per-minute:5}")
    private int authRequestsPerMinute;

    @Value("${app.rate-limiting.auth.requests-per-hour:50}")
    private int authRequestsPerHour;

    @Value("${app.rate-limiting.admin.requests-per-minute:30}")
    private int adminRequestsPerMinute;

    @Value("${app.rate-limiting.api.requests-per-minute:100}")
    private int apiRequestsPerMinute;

    @Value("${app.rate-limiting.enabled:true}")
    private boolean rateLimitingEnabled;

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    public RateLimitingConfiguration() {
        log.info("🔒 Initializing Rate Limiting Configuration with Bucket4j");
    }

    /**
     * Get or create a rate limit bucket for authentication endpoints
     * More restrictive: 5 requests/min, 50 requests/hour
     * Protects against brute force password attacks
     */
    public Bucket getAuthBucket(String key) {
        return cache.computeIfAbsent(key, k -> {
            Bandwidth minuteLimit = Bandwidth.classic(authRequestsPerMinute, Refill.intervally(authRequestsPerMinute, Duration.ofMinutes(1)));
            Bandwidth hourLimit = Bandwidth.classic(authRequestsPerHour, Refill.intervally(authRequestsPerHour, Duration.ofHours(1)));
            log.debug("🔐 Created auth rate limit bucket for key: {} ({} req/min, {} req/hour)", 
                     key, authRequestsPerMinute, authRequestsPerHour);
            return Bucket.builder()
                    .addLimit(minuteLimit)
                    .addLimit(hourLimit)
                    .build();
        });
    }

    /**
     * Get or create a rate limit bucket for admin endpoints
     * Moderate: 30 requests/min
     * Protects against accidental/intentional abuse of system admin operations
     */
    public Bucket getAdminBucket(String key) {
        return cache.computeIfAbsent(key, k -> {
            Bandwidth minuteLimit = Bandwidth.classic(adminRequestsPerMinute, Refill.intervally(adminRequestsPerMinute, Duration.ofMinutes(1)));
            log.debug("⚙️ Created admin rate limit bucket for key: {} ({} req/min)", 
                     key, adminRequestsPerMinute);
            return Bucket.builder()
                    .addLimit(minuteLimit)
                    .build();
        });
    }

    /**
     * Get or create a rate limit bucket for API endpoints
     * Lenient: 100 requests/min
     * Standard rate limiting for normal API usage
     */
    public Bucket getApiBucket(String key) {
        return cache.computeIfAbsent(key, k -> {
            Bandwidth minuteLimit = Bandwidth.classic(apiRequestsPerMinute, Refill.intervally(apiRequestsPerMinute, Duration.ofMinutes(1)));
            log.debug("📊 Created API rate limit bucket for key: {} ({} req/min)", 
                     key, apiRequestsPerMinute);
            return Bucket.builder()
                    .addLimit(minuteLimit)
                    .build();
        });
    }

    /**
     * Check if token can be consumed from auth bucket (login, password reset, etc.)
     */
    public boolean tryConsumeAuthToken(String key) {
        if (!rateLimitingEnabled) {
            return true;
        }
        boolean consumed = getAuthBucket(key).tryConsume(1);
        if (!consumed) {
            log.warn("⛔ Auth rate limit exceeded for key: {}", key);
        }
        return consumed;
    }

    /**
     * Check if token can be consumed from admin bucket (system settings, etc.)
     */
    public boolean tryConsumeAdminToken(String key) {
        if (!rateLimitingEnabled) {
            return true;
        }
        boolean consumed = getAdminBucket(key).tryConsume(1);
        if (!consumed) {
            log.warn("⛔ Admin rate limit exceeded for key: {}", key);
        }
        return consumed;
    }

    /**
     * Check if token can be consumed from API bucket (standard endpoints)
     */
    public boolean tryConsumeApiToken(String key) {
        if (!rateLimitingEnabled) {
            return true;
        }
        boolean consumed = getApiBucket(key).tryConsume(1);
        if (!consumed) {
            log.warn("⛔ API rate limit exceeded for key: {}", key);
        }
        return consumed;
    }

    /**
     * Get remaining tokens for auth bucket
     */
    public long getRemainingAuthTokens(String key) {
        var estimation = getAuthBucket(key).estimateAbilityToConsume(1);
        return estimation.canBeConsumed() ? 0 : 60;
    }

    /**
     * Get remaining tokens for admin bucket
     */
    public long getRemainingAdminTokens(String key) {
        var estimation = getAdminBucket(key).estimateAbilityToConsume(1);
        return estimation.canBeConsumed() ? 0 : 60;
    }

    /**
     * Get remaining tokens for API bucket
     */
    public long getRemainingApiTokens(String key) {
        var estimation = getApiBucket(key).estimateAbilityToConsume(1);
        return estimation.canBeConsumed() ? 0 : 60;
    }

    /**
     * Check if rate limiting is enabled
     */
    public boolean isEnabled() {
        return rateLimitingEnabled;
    }

    /**
     * Clear all cached buckets (useful for testing)
     */
    public void clearCache() {
        cache.clear();
        log.info("🧹 Rate limiting cache cleared");
    }
}
