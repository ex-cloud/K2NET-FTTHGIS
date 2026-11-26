package com.company.ftthgis.api.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Ringkasan status Dual-Certificate SAML 2.0 Overlap & Endpoint SP K2NET untuk konsol rotasi tenant.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SamlCertificatesStatusDto {
    private String organizationSlug;
    private String providerType;
    private boolean configured;
    private boolean overlapActive;
    private LocalDateTime overlapStartedAt;
    private LocalDateTime lastRotatedAt;
    private String keycloakAlias;
    private String spEntityId;
    private String spAcsUrl;
    private String spMetadataUrl;
    private SamlCertificateSlotDto primary;
    private SamlCertificateSlotDto secondary;
    private Long version;
}
