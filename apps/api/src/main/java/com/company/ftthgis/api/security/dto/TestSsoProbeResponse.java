package com.company.ftthgis.api.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO respons hasil uji coba koneksi langsung (Live Probe) ke penyedia identitas (IdP).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestSsoProbeResponse {
    private boolean success;
    private String message;
    private String providerType;
    private String issuer;
    private String authorizationEndpoint;
    private String tokenEndpoint;
    private String jwksUri;
    private String userinfoEndpoint;
    private long latencyMs;
    private LocalDateTime testedAt;
}

