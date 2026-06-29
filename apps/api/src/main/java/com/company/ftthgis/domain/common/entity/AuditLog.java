package com.company.ftthgis.domain.common.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Audit Log Entity
 * 
 * Logs all authorization failures and security-related events for compliance and monitoring.
 * Useful for:
 * - Detecting brute force attacks
 * - Tracking unauthorized access attempts
 * - Compliance audits
 * - Security analytics
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_user_id", columnList = "user_id"),
        @Index(name = "idx_audit_event_type", columnList = "event_type"),
        @Index(name = "idx_audit_timestamp", columnList = "timestamp"),
        @Index(name = "idx_audit_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Event type: 'AUTHORIZATION_FAILURE', 'AUTHENTICATION_FAILURE', 'RATE_LIMIT_EXCEEDED', etc.
     */
    @Column(nullable = false, length = 50)
    private String eventType;

    /**
     * User ID (if known), null for anonymous
     */
    @Column(name = "user_id")
    private UUID userId;

    /**
     * Username/Subject from JWT
     */
    @Column(length = 255)
    private String username;

    /**
     * Client IP address
     */
    @Column(length = 45)
    private String clientIp;

    /**
     * HTTP Method (GET, POST, PUT, DELETE, etc.)
     */
    @Column(length = 10)
    private String httpMethod;

    /**
     * Request URI/endpoint
     */
    @Column(columnDefinition = "TEXT")
    private String requestUri;

    /**
     * Required permission that was denied
     */
    @Column(length = 255)
    private String requiredPermission;

    /**
     * Status: 'DENIED', 'RATE_LIMIT_EXCEEDED', 'FAILED', etc.
     */
    @Column(nullable = false, length = 50)
    private String status;

    /**
     * Additional details (reason for denial, error message, etc.)
     */
    @Column(columnDefinition = "TEXT")
    private String details;

    /**
     * Severity level: 'INFO', 'WARN', 'ERROR', 'CRITICAL'
     */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String severity = "WARN";

    /**
     * Timestamp when the event occurred
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    /**
     * Organization ID (if tenant-specific)
     */
    @Column(name = "org_id", length = 255)
    private String organizationSlug;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }

    /**
     * Check if this log entry represents a suspicious pattern
     * (multiple failures in short time)
     */
    public boolean isSuspicious() {
        return "CRITICAL".equalsIgnoreCase(severity) || 
               "RATE_LIMIT_EXCEEDED".equalsIgnoreCase(eventType);
    }
}
