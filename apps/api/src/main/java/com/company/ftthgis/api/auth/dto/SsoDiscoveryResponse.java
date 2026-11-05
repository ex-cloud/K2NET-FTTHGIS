package com.company.ftthgis.api.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object (DTO) untuk respons Domain-Based Home Realm Discovery (HRD).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SsoDiscoveryResponse {

    private boolean ssoAvailable;
    private boolean enforceSso;
    private boolean allowBreakGlass;
    private String providerType;
    private String displayName;
    private String organizationSlug;
    private String organizationName;
    private String idpHint;
    private String redirectUrl;
    private String emailDomain;
}

