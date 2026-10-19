package com.company.ftthgis.api.tenant.dto;

import com.company.ftthgis.domain.tenant.entity.PackageBillingType;
import com.company.ftthgis.domain.tenant.entity.PackageCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PackageResponseDto {

    private UUID id;
    private String code;
    private String name;
    private PackageCategory category;
    private PackageBillingType billingType;
    private BigDecimal priceMonthly;
    private String minPlanTier;
    private List<String> prerequisiteCodes;
    private List<String> conflictCodes;
    private String featureKey;
    private String quotaDeltaJson;
    private String metadataJson;
    private boolean isPublished;
    private String lifecycleStatus;
    private String iconName;
    private String badgeLabel;
    private int sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Evaluasi dinamis per tenant (diisi saat dipanggil melalui marketplace tenant)
    private PackageEligibilityDto eligibility;
    private boolean isSubscribed;
    private LocalDateTime currentExpiresAt;
}
