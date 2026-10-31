package com.company.ftthgis.api.security.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformSecurityPolicyDto {
    private boolean mfaEnforced;
    private List<String> allowedMethods;
    private int gracePeriodDays;
    private int sessionIdleTimeout;
    private int mapAutoLockDuration;
    private boolean deviceVerificationEnabled;
    private boolean tenantCanEnforceMfa;
    private boolean ipAllowlistTenantAllowed;
    private int passwordMinLength;
    private boolean passwordRequireSymbols;
    private boolean passwordRequireNumbers;
    private boolean passwordRequireUppercase;
    private int passwordHistoryLimit;
    private int passwordExpiryDays;
}

