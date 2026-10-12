package com.company.ftthgis.api.system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrantPackageRequest {

    @NotNull(message = "ID paket wajib diisi")
    private UUID packageId;

    @Positive(message = "Durasi hari grant harus positif")
    @Builder.Default
    private int durationDays = 30; // e.g. 7, 14, 30 hari

    @NotBlank(message = "Catatan pemberian paket wajib diisi")
    private String grantNotes; // e.g. "POC Uji Coba Telemetri OLT Sales Pilot"
}
