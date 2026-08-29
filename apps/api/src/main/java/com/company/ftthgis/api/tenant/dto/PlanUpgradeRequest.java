package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanUpgradeRequest {
    private String newPlanName; // "FREE", "PRO", "ENTERPRISE", "CUSTOM"
    private String planCycle;   // "MONTHLY", "YEARLY"
    private boolean isDirectOverride; // Super Admin God-Mode
    private String notes;       // e.g. PO reference / manual wire transfer
}
