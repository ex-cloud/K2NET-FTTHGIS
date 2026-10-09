package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO yang merepresentasikan hak kuota dan fitur efektif (Entitlements) organisasi tenant.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LicenseEntitlementsDto {

    private int maxProjects;
    private int maxOdps;
    private int maxOdcs;
    private int maxCustomers;
    private int maxStorageGb;

    @Builder.Default
    private boolean ssoEnabled = false;

    @Builder.Default
    private boolean apiEnabled = false;

    @Builder.Default
    private boolean aiCopilotEnabled = false;

    @Builder.Default
    private boolean customDomainEnabled = false;

    /**
     * Sumber penghitungan kuota: LICENSE_OVERRIDE, EMERGENCY_BOOSTER, atau BASE_PLAN
     */
    private String calculationSource;
}
