package com.company.ftthgis.domain.network.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatusCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String STATUS_KEY_PREFIX = "asset:status:";
    private static final long DEFAULT_TTL_HOURS = 24;

    /**
     * Set asset status in Redis cache
     * 
     * @param assetCode Unique code of the asset
     * @param status    Status string (ACTIVE, DOWN, MAINTENANCE)
     */
    public void setStatus(String assetCode, String status) {
        String key = STATUS_KEY_PREFIX + assetCode;
        try {
            redisTemplate.opsForValue().set(key, status, DEFAULT_TTL_HOURS, TimeUnit.HOURS);
            log.debug("Cached status for {}: {}", assetCode, status);
        } catch (Exception e) {
            log.warn("Failed to cache status in Redis for {}: {}", assetCode, e.getMessage());
        }
    }

    /**
     * Get asset status from Redis cache
     * 
     * @param assetCode Unique code of the asset
     * @return Status string or null if not found/error
     */
    public String getStatus(String assetCode) {
        String key = STATUS_KEY_PREFIX + assetCode;
        try {
            Object status = redisTemplate.opsForValue().get(key);
            return status != null ? status.toString() : null;
        } catch (Exception e) {
            log.warn("Failed to retrieve status from Redis for {}: {}", assetCode, e.getMessage());
            return null;
        }
    }

    /**
     * Remove asset status from cache
     */
    public void evictStatus(String assetCode) {
        String key = STATUS_KEY_PREFIX + assetCode;
        redisTemplate.delete(key);
    }
}
