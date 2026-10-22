package com.company.ftthgis.api.system.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePlanVersionRequest {

    @NotBlank(message = "version is required")
    private String version;

    @Builder.Default
    private String status = "DRAFT"; // DRAFT, ACTIVE

    @NotNull(message = "priceMonthly is required")
    @DecimalMin(value = "0.00", message = "priceMonthly must be >= 0")
    private BigDecimal priceMonthly;

    private BigDecimal priceYearly;

    @Builder.Default
    private String currency = "IDR";

    private Integer maxProjects;
    private Integer maxArchivedProjects;
    private Integer maxOlts;
    private Integer maxOdcs;
    private Integer maxOdps;
    private Integer maxCustomers;
    private Integer maxStorageGb;
    private Integer apiRateLimitRpm;

    private Boolean hasSso;
    private Boolean hasApiAccess;
    private Boolean hasAiCopilot;
    private Boolean hasCustomDomain;

    private Integer graceDays;
    private Integer readonlyDays;

    private String changelog;
}
