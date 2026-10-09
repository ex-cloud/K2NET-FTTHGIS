package com.company.ftthgis.api.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Ringkasan metrik KPI lisensi lintas tenant untuk dasbor Super Admin platform.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LicenseOverviewKpiDto {

    private long totalLicenses;
    private long activeLicenses;
    private long gracePeriodLicenses;
    private long readOnlyLicenses;
    private long suspendedLicenses;
    private long expiringIn30Days;

    @Builder.Default
    private Map<String, Long> tierDistribution = Map.of();
}
