package com.company.ftthgis.api.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PackageKpiOverviewDto {
    private long totalPackages;
    private long publishedPackages;
    private long activeSubscriptions;
    private long distinctSubscribedTenants;
    private BigDecimal estimatedAddonMrr;
}
