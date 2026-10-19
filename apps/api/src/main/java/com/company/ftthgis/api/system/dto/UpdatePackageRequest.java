package com.company.ftthgis.api.system.dto;

import com.company.ftthgis.domain.tenant.entity.PackageBillingType;
import com.company.ftthgis.domain.tenant.entity.PackageCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePackageRequest {

    @NotBlank(message = "Nama paket wajib diisi")
    private String name;

    @NotNull(message = "Kategori paket wajib diisi")
    private PackageCategory category;

    private PackageBillingType billingType;

    @NotNull(message = "Harga bulanan wajib diisi")
    @PositiveOrZero(message = "Harga bulanan tidak boleh negatif")
    private BigDecimal priceMonthly;

    private String minPlanTier;

    private List<String> prerequisiteCodes;

    private List<String> conflictCodes;

    private String featureKey;

    private String quotaDeltaJson;

    private String metadataJson;

    private Boolean isPublished;
    private String lifecycleStatus;
    private String iconName;

    private String badgeLabel;

    private Integer sortOrder;
}
