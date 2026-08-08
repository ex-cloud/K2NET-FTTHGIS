package com.company.ftthgis.domain.task.dto;

/**
 * Summary DTO used by the System Overview KPI card.
 * Returns aggregate counts scoped to the current tenant (or all tenants for Super Admin).
 */
public record TaskSummaryDTO(
        long totalOpen,
        long urgentCount,
        long resolvedToday
) {}
