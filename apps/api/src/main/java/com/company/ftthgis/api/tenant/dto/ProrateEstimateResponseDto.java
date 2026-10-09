package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Estimasi rincian perhitungan prorata saat tenant melakukan upgrade paket langganan
 * di tengah periode siklus berjalan (Mid-Cycle Upgrade).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProrateEstimateResponseDto {

    private String currentPlan;
    private String targetPlan;
    private BigDecimal currentPlanPrice;
    private BigDecimal targetPlanPrice;
    private long daysRemaining;
    private int totalCycleDays;
    private BigDecimal dailyRateOld;
    private BigDecimal proratedCredit;
    private BigDecimal netDueAmount;
    private String currency;
    private boolean isUpgradeEligible;
    private String calculationSummary;
}
