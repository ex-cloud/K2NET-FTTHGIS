package com.company.ftthgis.api.system.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Permintaan perpanjangan masa aktif lisensi oleh Super Admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LicenseExtendRequest {

    @Min(value = 1, message = "Durasi perpanjangan minimal 1 bulan")
    @Max(value = 60, message = "Durasi perpanjangan maksimal 60 bulan")
    @Builder.Default
    private int additionalMonths = 1;

    private String notes;
}
