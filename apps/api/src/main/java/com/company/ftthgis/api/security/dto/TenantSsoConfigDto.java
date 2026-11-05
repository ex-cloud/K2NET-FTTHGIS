package com.company.ftthgis.api.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DTO respons untuk konfigurasi SSO (Single Sign-On) organisasi tenant.
 * Menyembunyikan rahasia kredensial (client_secret) dengan masking demi keamanan.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantSsoConfigDto {
    private UUID id;
    private String organizationSlug;
    private String organizationName;
    private String providerType;
    private String displayName;
    private String issuerUrl;
    private String clientId;
    private boolean hasClientSecret;
    private String maskedClientSecret;
    private String metadataUrl;
    private String entityId;
    private String singleSignOnUrl;
    private String signingCertificate;
    private boolean enforceSso;
    private boolean allowBreakGlassBypass;
    private List<String> domainMappings;
    private Map<String, String> attributeMapping;
    private String status;
    private LocalDateTime lastTestAt;
    private String lastTestStatus;
    private String lastTestErrorMessage;
    private Long version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

