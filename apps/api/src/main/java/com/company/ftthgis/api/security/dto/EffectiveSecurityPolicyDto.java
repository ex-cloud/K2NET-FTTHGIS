package com.company.ftthgis.api.security.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EffectiveSecurityPolicyDto {
    private String organizationSlug;
    private boolean mfaRequired;
    private List<String> allowedMethods;
    private int gracePeriodDays;
    private int sessionIdleMinutes;
    private boolean deviceVerificationRequired;
    private boolean isMfaEnforcedByPlatform;
    private boolean isMfaEnforcedByTenant;
    private String effectiveSource; // "PLATFORM", "TENANT", "STRICTER_COMBINED"
}

