package com.company.ftthgis.api.security.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request untuk men-stage sertifikat X.509 Secondary baru dalam alur Dual-Cert Overlap SAML 2.0.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StageSamlCertificateRequest {

    @NotBlank(message = "X.509 certificate PEM must not be blank")
    @Size(max = 16384, message = "X.509 certificate PEM cannot exceed 16384 characters")
    private String certificatePem;
}
