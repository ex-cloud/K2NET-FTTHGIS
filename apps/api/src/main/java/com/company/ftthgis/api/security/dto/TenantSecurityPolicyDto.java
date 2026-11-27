package com.company.ftthgis.api.security.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    private boolean allowSocialLogin;
    private String googleHostedDomain;
    private List<String> allowedMethods;
    private int gracePeriodDays;
    private int sessionIdleMinutes;
    private boolean deviceVerificationRequired;
    private String ipAllowlistCidrs;
    private String ipPolicyMode;
    private List<String> allowedCountries;
    private boolean allowBreakGlassIpBypass;
    private boolean ipAllowlistPlatformAllowed;
    private String callerIp;
    private String callerCountry;
    private boolean effectiveMfaEnforced;

    @JsonProperty("isLockedByPlatform")
    private boolean isLockedByPlatform;

    private LocalDateTime updatedAt;
}
