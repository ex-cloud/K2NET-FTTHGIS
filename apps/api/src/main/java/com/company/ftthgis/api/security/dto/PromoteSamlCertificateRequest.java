package com.company.ftthgis.api.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request untuk mempromosikan sertifikat Secondary SAML menjadi Primary secara atomik.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromoteSamlCertificateRequest {

    /**
     * Jika true, sertifikat Primary lama dipertahankan di slot Secondary sebagai rollback cepat.
     * Default false (clean cutover).
     */
    @Builder.Default
    private boolean keepPreviousAsSecondary = false;
}
