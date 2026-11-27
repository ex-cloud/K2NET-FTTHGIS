package com.company.ftthgis.api.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemIpPolicyOverviewDto {
    private UUID organizationId;
    private String organizationName;
    private String organizationSlug;
    private String ipPolicyMode;
    private int cidrCount;
    private List<String> allowedCountries;
    private boolean allowBreakGlassIpBypass;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
