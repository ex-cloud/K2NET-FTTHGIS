package com.company.ftthgis.api.tenant.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Permintaan aktivasi lisensi offline melalui berkas sertifikat kriptografis (.lic)
 * untuk instalasi server intranet tertutup (Air-Gapped).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfflineLicenseActivateRequest {

    @NotBlank(message = "Konten berkas sertifikat lisensi tidak boleh kosong")
    private String certificateContent;

    /**
     * Sidik jari hardware (SHA-256) server on-premise saat aktivasi.
     */
    private String machineFingerprint;
}
