package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanDowngradeRequest {
    private String targetPlanName; // "FREE", "PRO"
    private String reason;         // e.g. "Surat 042/ISP/VIII/2026"
    private boolean acknowledgeOverQuota; // Must acknowledge if current assets exceed target plan
}
