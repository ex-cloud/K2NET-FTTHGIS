package com.company.ftthgis.domain.common.repository;

import com.company.ftthgis.domain.common.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for AuditLog entity
 * 
 * Provides query methods for audit log analysis and monitoring
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    /**
     * Find audit logs by user ID
     */
    Page<AuditLog> findByUserId(UUID userId, Pageable pageable);

    /**
     * Find audit logs by username
     */
    Page<AuditLog> findByUsername(String username, Pageable pageable);

    /**
     * Find audit logs by event type
     */
    Page<AuditLog> findByEventType(String eventType, Pageable pageable);

    /**
     * Find audit logs by status
     */
    Page<AuditLog> findByStatus(String status, Pageable pageable);

    /**
     * Find audit logs by client IP
     */
    Page<AuditLog> findByClientIp(String clientIp, Pageable pageable);

    /**
     * Find failed authorization attempts for a user in time window
     */
    @Query("SELECT a FROM AuditLog a WHERE a.userId = :userId AND a.eventType = 'AUTHORIZATION_FAILURE' " +
           "AND a.timestamp >= :since ORDER BY a.timestamp DESC")
    List<AuditLog> findRecentAuthorizationFailures(
            @Param("userId") UUID userId,
            @Param("since") LocalDateTime since);

    /**
     * Find suspicious activity (rate limit exceeded or multiple failures)
     */
    @Query("SELECT a FROM AuditLog a WHERE a.severity = 'CRITICAL' OR a.eventType = 'RATE_LIMIT_EXCEEDED' " +
           "AND a.timestamp >= :since ORDER BY a.timestamp DESC")
    Page<AuditLog> findSuspiciousActivity(
            @Param("since") LocalDateTime since,
            Pageable pageable);

    /**
     * Find recent audit logs
     */
    Page<AuditLog> findByTimestampAfter(LocalDateTime timestamp, Pageable pageable);

    /**
     * Count authorization failures for user in time window
     */
    Long countByUserIdAndEventTypeAndTimestampAfter(UUID userId, String eventType, LocalDateTime since);

    /**
     * Count rate limit violations by IP in time window
     */
    Long countByClientIpAndEventTypeAndTimestampAfter(String clientIp, String eventType, LocalDateTime since);
}
