package com.company.ftthgis.api.security.dto;

import java.util.List;

public record UpdatePlatformSecurityPolicyRequest(
    Boolean mfaEnforced,
    List<String> allowedMethods,
    Integer gracePeriodDays,
    Integer sessionIdleTimeout,
    Integer mapAutoLockDuration,
    Boolean deviceVerificationEnabled,
    Boolean tenantCanEnforceMfa,
    Boolean ipAllowlistTenantAllowed,
    Integer passwordMinLength,
    Boolean passwordRequireSymbols,
    Boolean passwordRequireNumbers,
    Boolean passwordRequireUppercase,
    Integer passwordHistoryLimit,
    Integer passwordExpiryDays
) {}

