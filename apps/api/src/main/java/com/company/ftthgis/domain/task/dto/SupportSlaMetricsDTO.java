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
        double avgResolutionHours,
        // Tier 1 - Critical (URGENT)
        long sev1Total,
        long sev1Open,
        long sev1Resolved,
        double sev1ComplianceRate,
        // Tier 2 - Major (HIGH)
        long sev2Total,
        long sev2Open,
        long sev2Resolved,
        double sev2ComplianceRate,
        // Tier 3 - Normal (NORMAL & LOW)
        long sev3Total,
        long sev3Open,
        long sev3Resolved,
        double sev3ComplianceRate
) {
    public SupportSlaMetricsDTO(
            long totalTickets,
            long openTickets,
            long resolvedTickets,
            long urgentBreachRisk,
            double slaComplianceRate,
            double avgResolutionHours
    ) {
        this(
                totalTickets, openTickets, resolvedTickets, urgentBreachRisk, slaComplianceRate, avgResolutionHours,
                urgentBreachRisk, urgentBreachRisk, 0L, urgentBreachRisk > 0 ? 0.0 : 100.0,
                0L, 0L, 0L, 100.0,
                0L, 0L, 0L, 100.0
        );
    }
}
