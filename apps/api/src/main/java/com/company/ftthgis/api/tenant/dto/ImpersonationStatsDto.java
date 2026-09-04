package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImpersonationStatsDto {
    private long activeCount;
    private long todayCount;
    private long total7dCount;
    private long avgDurationSeconds;
    private long uniqueTenants7dCount;
    private long forceRevokedCount;
}
