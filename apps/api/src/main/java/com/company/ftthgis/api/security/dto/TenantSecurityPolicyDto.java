package com.company.ftthgis.api.security.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantSecurityPolicyDto {
    private UUID id;
    private String organizationSlug;
    private String organizationName;
    private boolean mfaEnforced;
    private List<String> allowedMethods;
    private int gracePeriodDays;
    private int sessionIdleMinutes;
    private boolean deviceVerificationRequired;
    private String ipAllowlistCidrs;
    private boolean effectiveMfaEnforced;
    private boolean isLockedByPlatform;
    private LocalDateTime updatedAt;
}

