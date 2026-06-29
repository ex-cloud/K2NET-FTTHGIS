package com.company.ftthgis.service;

import com.company.ftthgis.domain.common.entity.AuditLog;
import com.company.ftthgis.domain.common.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Audit Logging Service
 * 
 * Logs security-related events for compliance, monitoring, and threat detection.
 * Designed to log asynchronously to minimize performance impact.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLoggingService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Log an authorization failure event (async, non-blocking)
     */
    @Async
    @Transactional
    public void logAuthorizationFailure(String username, UUID userId, String clientIp, 
                                        String httpMethod, String requestUri, 
                                        String requiredPermission, String details) {
        AuditLog entry = AuditLog.builder()
                .eventType("AUTHORIZATION_FAILURE")
                .username(username)
                .userId(userId)
                .clientIp(clientIp)
                .httpMethod(httpMethod)
                .requestUri(requestUri)
                .requiredPermission(requiredPermission)
                .status("DENIED")
                .details(details)
                .severity("WARN")
            .build();
        
        auditLogRepository.save(entry);
        log.info("📝 Logged authorization failure for user: {}, endpoint: {}, permission: {}", 
            username, requestUri, requiredPermission);
    }

    /**
     * Log a rate limit exceeded event
     */
    @Async
    @Transactional
    public void logRateLimitExceeded(String clientId, String clientIp, String httpMethod, 
                                      String requestUri, String details) {
        AuditLog entry = AuditLog.builder()
                .eventType("RATE_LIMIT_EXCEEDED")
                .username(clientId)
                .clientIp(clientIp)
                .httpMethod(httpMethod)
                .requestUri(requestUri)
                .status("RATE_LIMITED")
                .details(details)
                .severity("WARN")
            .build();
        
        auditLogRepository.save(entry);
        log.info("⚠️ Logged rate limit exceeded for client: {}, endpoint: {}", clientId, requestUri);
    }

    /**
     * Log an authentication failure event
     */
    @Async
    @Transactional
    public void logAuthenticationFailure(String username, String clientIp, String httpMethod, 
                                         String requestUri, String reason) {
        AuditLog entry = AuditLog.builder()
                .eventType("AUTHENTICATION_FAILURE")
                .username(username)
                .clientIp(clientIp)
                .httpMethod(httpMethod)
                .requestUri(requestUri)
                .status("FAILED")
                .details(reason)
                .severity("WARN")
            .build();
        
        auditLogRepository.save(entry);
        log.warn("🔐 Logged authentication failure for user: {}, endpoint: {}", username, requestUri);
    }

    /**
     * Log a suspicious activity event
     */
    @Async
    @Transactional
    public void logSuspiciousActivity(UUID userId, String username, String clientIp, 
                                      String eventType, String details) {
        AuditLog entry = AuditLog.builder()
                .eventType(eventType)
                .userId(userId)
                .username(username)
                .clientIp(clientIp)
                .status("SUSPICIOUS")
                .details(details)
                .severity("CRITICAL")
            .build();
        
        auditLogRepository.save(entry);
        log.error("🚨 SUSPICIOUS ACTIVITY DETECTED: user={}, type={}, ip={}, details={}", 
             username, eventType, clientIp, details);
    }

    /**
     * Get recent authorization failures for a user
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getRecentAuthorizationFailures(UUID userId, int minutes) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(minutes);
        return auditLogRepository.findRecentAuthorizationFailures(userId, since);
    }

    /**
     * Count authorization failures for user in time window
     */
    @Transactional(readOnly = true)
    public long countRecentAuthorizationFailures(UUID userId, int minutes) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(minutes);
        return auditLogRepository.countByUserIdAndEventTypeAndTimestampAfter(
                userId, "AUTHORIZATION_FAILURE", since);
    }

    /**
     * Count rate limit violations by IP
     */
    @Transactional(readOnly = true)
    public long countRecentRateLimitViolations(String clientIp, int minutes) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(minutes);
        return auditLogRepository.countByClientIpAndEventTypeAndTimestampAfter(
                clientIp, "RATE_LIMIT_EXCEEDED", since);
    }

    /**
     * Get audit logs for a user
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogsForUser(UUID userId, int page, int size) {
        return auditLogRepository.findByUserId(userId, PageRequest.of(page, size));
    }

    /**
     * Get recent suspicious activities
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> getSuspiciousActivity(int hours, int page, int size) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return auditLogRepository.findSuspiciousActivity(since, PageRequest.of(page, size));
    }

    /**
     * Get audit logs by event type
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogsByEventType(String eventType, int page, int size) {
        return auditLogRepository.findByEventType(eventType, PageRequest.of(page, size));
    }

    /**
     * Alert if user has too many authorization failures
     * Returns true if suspicious pattern detected
     */
    @Transactional(readOnly = true)
    public boolean detectSuspiciousPattern(UUID userId, int failureThreshold, int timeWindowMinutes) {
        long recentFailures = countRecentAuthorizationFailures(userId, timeWindowMinutes);
        if (recentFailures >= failureThreshold) {
            log.warn("🚨 SUSPICIOUS PATTERN DETECTED: User {} has {} failures in {} minutes",
                    userId, recentFailures, timeWindowMinutes);
            return true;
        }
        return false;
    }

    /**
     * Clean up old audit logs (retention policy)
     */
    @Transactional
    public void purgeOldLogs(int retentionDays) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDays);
        List<AuditLog> oldLogs = auditLogRepository.findByTimestampAfter(
                cutoffDate.minusSeconds(1), 
                PageRequest.of(0, Integer.MAX_VALUE)).getContent();
        
        if (!oldLogs.isEmpty()) {
            auditLogRepository.deleteAll(oldLogs);
            log.info("🧹 Purged {} old audit logs (older than {} days)", oldLogs.size(), retentionDays);
        }
    }
}
