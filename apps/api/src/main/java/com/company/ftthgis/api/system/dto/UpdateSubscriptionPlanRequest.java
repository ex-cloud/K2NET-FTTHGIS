package com.company.ftthgis.api.system.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Permintaan pembaruan data paket langganan master oleh Super Admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSubscriptionPlanRequest {

    private String description;

    @NotNull(message = "Harga paket tidak boleh kosong")
    @DecimalMin(value = "0.0", inclusive = true, message = "Harga paket minimal Rp 0")
    private BigDecimal price;

    @Min(value = 1, message = "Maksimum project minimal 1")
    private Integer maxProjects;

    @Min(value = 0, message = "Maksimum archived project minimal 0")
    private Integer maxArchivedProjects;

    @Min(value = 0, message = "Maksimum ODC minimal 0")
    private Integer maxOdcs;

    @Min(value = 0, message = "Maksimum ODP minimal 0")
    private Integer maxOdps;

    @Min(value = 0, message = "Maksimum pelanggan minimal 0")
    private Integer maxCustomers;

    @Min(value = 0, message = "Maksimum OLT minimal 0")
    private Integer maxOlts;

    @Min(value = 0, message = "Maksimum storage minimal 0 GB")
    private Integer maxStorageGb;

    @Min(value = 0, message = "Batas API rate limit minimal 0 RPM")
    private Integer apiRateLimitRpm;

    private Boolean hasSso;

    private Boolean hasApiAccess;
}
