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
public class CreatePackageRequest {

    @NotBlank(message = "Kode paket wajib diisi")
    private String code; // e.g. PKG_OLT_POLLER

    @NotBlank(message = "Nama paket wajib diisi")
    private String name;

    @NotNull(message = "Kategori paket wajib diisi")
    private PackageCategory category;

    @Builder.Default
    private PackageBillingType billingType = PackageBillingType.RECURRING_MONTHLY;

    @NotNull(message = "Harga bulanan wajib diisi")
    @PositiveOrZero(message = "Harga bulanan tidak boleh negatif")
    private BigDecimal priceMonthly;

    @Builder.Default
    private String minPlanTier = "FREE"; // FREE, STARTER, PRO, ENTERPRISE

    private List<String> prerequisiteCodes;

    private List<String> conflictCodes;

    private String featureKey;

    private String quotaDeltaJson; // e.g. {"deltaOlts": 5}

    private String metadataJson;

    @Builder.Default
    private boolean isPublished = true;

    @Builder.Default
    private String lifecycleStatus = "PUBLISHED";

    @Builder.Default
    private String iconName = "Package";

    private String badgeLabel;

    @Builder.Default
    private int sortOrder = 0;
}
