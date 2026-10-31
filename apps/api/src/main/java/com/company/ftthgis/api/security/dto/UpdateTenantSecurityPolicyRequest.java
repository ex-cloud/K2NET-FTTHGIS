package com.company.ftthgis.api.security.dto;

import java.util.List;

public record UpdateTenantSecurityPolicyRequest(
    Boolean mfaEnforced,
    List<String> allowedMethods,
    Integer gracePeriodDays,
    Integer sessionIdleMinutes,
    Boolean deviceVerificationRequired,
    String ipAllowlistCidrs
) {}

