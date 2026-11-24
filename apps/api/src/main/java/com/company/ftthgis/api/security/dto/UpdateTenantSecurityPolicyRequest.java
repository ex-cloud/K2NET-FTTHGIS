package com.company.ftthgis.api.security.dto;

import java.util.List;

public record UpdateTenantSecurityPolicyRequest(
    Boolean mfaEnforced,
    Boolean allowSocialLogin,
    List<String> allowedMethods,
    Integer gracePeriodDays,
    Integer sessionIdleMinutes,
    Boolean deviceVerificationRequired,
    String ipAllowlistCidrs,
    String googleHostedDomain
) {
    public UpdateTenantSecurityPolicyRequest(
        Boolean mfaEnforced,
        Boolean allowSocialLogin,
        List<String> allowedMethods,
        Integer gracePeriodDays,
        Integer sessionIdleMinutes,
        Boolean deviceVerificationRequired,
        String ipAllowlistCidrs
    ) {
        this(mfaEnforced, allowSocialLogin, allowedMethods, gracePeriodDays, sessionIdleMinutes, deviceVerificationRequired, ipAllowlistCidrs, null);
    }

    public UpdateTenantSecurityPolicyRequest(
        Boolean mfaEnforced,
        List<String> allowedMethods,
        Integer gracePeriodDays,
        Integer sessionIdleMinutes,
        Boolean deviceVerificationRequired,
        String ipAllowlistCidrs
    ) {
        this(mfaEnforced, null, allowedMethods, gracePeriodDays, sessionIdleMinutes, deviceVerificationRequired, ipAllowlistCidrs, null);
    }
}

