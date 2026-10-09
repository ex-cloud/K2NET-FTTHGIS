package com.company.ftthgis.api.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Permintaan pencabutan (kill-switch) darurat lisensi tenant oleh Super Admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LicenseRevokeRequest {

    @NotBlank(message = "Alasan pencabutan lisensi wajib diisi")
    private String reason;
}
