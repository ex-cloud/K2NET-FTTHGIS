package com.company.ftthgis.api.tenant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Permintaan aktivasi mandiri kode lisensi oleh pengguna tenant.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LicenseActivateRequest {

    @NotBlank(message = "Kode lisensi wajib diisi")
    @Pattern(
            regexp = "^K2NET-[A-Z0-9]+-[A-F0-9]{8}-[A-F0-9]{4}$",
            message = "Format kode lisensi tidak valid. Contoh format: K2NET-PRO-9F4D2A1C-7B8E"
    )
    private String licenseKey;

    private String machineFingerprint;
}
