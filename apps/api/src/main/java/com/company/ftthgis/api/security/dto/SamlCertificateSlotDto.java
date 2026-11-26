package com.company.ftthgis.api.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Detail metadata kriptografis satu slot sertifikat SAML 2.0 (PRIMARY atau SECONDARY).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SamlCertificateSlotDto {
    private String slot;
    private boolean present;
    private String subject;
    private String issuer;
    private String serialNumber;
    private String sha256Fingerprint;
    private LocalDateTime notBefore;
    private LocalDateTime expiresAt;
    private Long daysRemaining;
    private String status;
}
