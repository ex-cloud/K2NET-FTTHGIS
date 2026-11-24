package com.company.ftthgis.api.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Respons hasil pemeriksaan DNS TXT record secara langsung untuk verifikasi domain SSO.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifySsoDomainResponse {
    private boolean verified;
    private SsoVerifiedDomainDto domain;
    private String message;
    private List<String> observedTxtRecords;
}
