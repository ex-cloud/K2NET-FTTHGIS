package com.company.ftthgis.api.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Permintaan pemulihan lisensi (reinstate) dari status REVOKED / SUSPENDED menjadi ACTIVE.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LicenseReinstateRequest {

    @NotBlank(message = "Alasan pemulihan lisensi wajib diisi")
    private String reason;
}
