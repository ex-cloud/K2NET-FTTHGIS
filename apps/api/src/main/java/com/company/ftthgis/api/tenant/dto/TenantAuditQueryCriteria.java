package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Filter criteria for querying audit logs at tenant organization and project levels.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantAuditQueryCriteria {
    private String search;
    private String action;
    private String resourceType;
    private String actorId;
    private String scope;
    private String category;
    private String severity;
    private String projectId;
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    @Builder.Default
    private int page = 0;

    @Builder.Default
    private int size = 50;

    @Builder.Default
    private String sortDirection = "DESC";
}
