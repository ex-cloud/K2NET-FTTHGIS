package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Data Transfer Object for Tenant-scoped Audit Events (Organization & Project Scope).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantAuditEventDto {
    private String id;
    private String tenantSlug;
    private String actorId;
    private String actorEmail;
    private String actorRole;
    private String actorIp;
    private String action;
    private String resourceType;
    private String resourceId;
    private String scope;        // "ORGANIZATION", "PROJECT", "SYSTEM"
    private String category;     // "NETWORK", "IAM", "TASK", "SETTINGS", "SECURITY", "BILLING", "OPERATIONS"
    private String severity;     // "INFO", "WARN", "ERROR", "CRITICAL"
    private String projectId;
    private String projectName;
    private Map<String, Object> oldValue;
    private Map<String, Object> newValue;
    private Map<String, Object> metadata;
    private LocalDateTime occurredAt;
}
