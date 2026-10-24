package com.company.ftthgis.domain.task.dto;

/**
 * <h1>SupportSlaMetricsDTO</h1>
 * <p>
 * Metrik SLA agregat untuk antrean B2B Support Tickets (scope = TENANT_TO_PLATFORM).
 * Digunakan oleh SLA & Reports dashboard serta notification health check.
 * </p>
 */
public record SupportSlaMetricsDTO(
        long totalTickets,
        long openTickets,
        long resolvedTickets,
        long urgentBreachRisk,
        double slaComplianceRate,
        double avgResolutionHours
) {}
