package com.company.ftthgis.api.security.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO permintaan untuk menyimpan atau memperbarui konfigurasi SSO organisasi tenant.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTenantSsoConfigRequest {

    @NotBlank(message = "Provider type must not be blank")
    @Pattern(regexp = "^(GOOGLE|GITHUB|MICROSOFT_ENTRA|OKTA|KEYCLOAK_OIDC|OIDC_CUSTOM|SAML_CUSTOM)$",
            message = "Provider type must be one of: GOOGLE, GITHUB, MICROSOFT_ENTRA, OKTA, KEYCLOAK_OIDC, OIDC_CUSTOM, SAML_CUSTOM")
    private String providerType;

    @Size(max = 128, message = "Display name cannot exceed 128 characters")
    private String displayName;

    @Size(max = 512, message = "Issuer URL cannot exceed 512 characters")
    private String issuerUrl;

    @NotBlank(message = "Client ID must not be blank")
    @Size(max = 256, message = "Client ID cannot exceed 256 characters")
    private String clientId;

    /**
     * Rahasia kredensial (plaintext dari admin).
     * Jika null atau kosong saat update dan kredensial lama sudah ada, rahasia lama akan dipertahankan.
     */
    private String clientSecret;

    @Size(max = 512, message = "Metadata URL cannot exceed 512 characters")
    private String metadataUrl;

    @Size(max = 256, message = "Entity ID cannot exceed 256 characters")
    private String entityId;

    @Size(max = 512, message = "Single Sign-On URL cannot exceed 512 characters")
    private String singleSignOnUrl;

    private String signingCertificate;

    @Builder.Default
    private boolean enforceSso = false;

    @Builder.Default
    private boolean allowBreakGlassBypass = true;

    private List<String> domainMappings;

    private Map<String, String> attributeMapping;

    @Builder.Default
    private String status = "ACTIVE";

    /**
     * Versi entitas untuk Optimistic Locking (@Version) guna mencegah tabrakan data (race condition).
     */
    private Long version;
}

