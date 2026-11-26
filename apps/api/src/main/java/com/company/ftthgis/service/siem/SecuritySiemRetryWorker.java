package com.company.ftthgis.service.siem;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

/**
 * Distributed-lock protected scheduler that drains due SIEM webhook deliveries
 * and transitions exhausted items to FAILED_DLQ.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SecuritySiemRetryWorker {

    private static final String LOCK_KEY = "k2net:lock:siem-retry-worker";

    private final SecuritySiemStreamingService streamingService;

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    @Scheduled(fixedDelay = 30000)
    public void runRetrySweep() {
        String lockToken = UUID.randomUUID().toString();
        boolean acquired = true;
        if (redisTemplate != null) {
            try {
                Boolean ok = redisTemplate.opsForValue().setIfAbsent(LOCK_KEY, lockToken, Duration.ofSeconds(55));
                acquired = Boolean.TRUE.equals(ok);
            } catch (Exception e) {
                log.debug("Redis lock unavailable for SecuritySiemRetryWorker, continuing: {}", e.getMessage());
            }
        }
        if (!acquired) {
            return;
        }

        try {
            streamingService.processDueRetries();
        } finally {
            if (redisTemplate != null) {
                try {
                    String current = redisTemplate.opsForValue().get(LOCK_KEY);
                    if (lockToken.equals(current)) {
                        redisTemplate.delete(LOCK_KEY);
                    }
                } catch (Exception ignored) {
                }
            }
        }
    }
}
