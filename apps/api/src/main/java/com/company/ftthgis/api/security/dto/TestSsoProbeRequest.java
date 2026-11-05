package com.company.ftthgis.api.security.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO permintaan untuk uji coba koneksi langsung (Live Probe) ke penyedia identitas (IdP).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestSsoProbeRequest {

    @NotBlank(message = "Provider type must not be blank")
    private String providerType;

    private String issuerUrl;

    private String metadataUrl;

    private String clientId;

    private String clientSecret;
}

