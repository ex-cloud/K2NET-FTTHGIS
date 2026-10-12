package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO ringkasan hak fitur aktif (Entitlements) dan booster kuota paket add-on tenant.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantEntitlementsResponseDto {

    private List<String> activeFeatures;
    private List<String> activePackages;
    private Map<String, Integer> quotaDeltas;
    private Map<String, Object> quotaSummary;
}
