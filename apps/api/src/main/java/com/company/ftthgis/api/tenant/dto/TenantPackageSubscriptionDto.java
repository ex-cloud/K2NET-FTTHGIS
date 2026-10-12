package com.company.ftthgis.api.tenant.dto;

import com.company.ftthgis.domain.tenant.entity.PackageBillingType;
import com.company.ftthgis.domain.tenant.entity.PackageCategory;
import com.company.ftthgis.domain.tenant.entity.PackageSubscriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantPackageSubscriptionDto {

    private UUID id;
    private UUID organizationId;
    private String organizationName;

    // Detail Paket Terkait
    private UUID packageId;
    private String packageCode;
    private String packageName;
    private PackageCategory packageCategory;
    private PackageBillingType billingType;
    private BigDecimal priceMonthly;
    private String iconName;
    private String badgeLabel;
    private String featureKey;
    private String quotaDeltaJson;

    // Status Langganan
    private PackageSubscriptionStatus status;
    private String grantedBy;
    private String grantNotes;
    private LocalDateTime activatedAt;
    private LocalDateTime expiresAt;
    private boolean autoRenew;
    private boolean isActive;

    // Faktur Terakhir
    private UUID lastInvoiceId;
    private String lastInvoiceNumber;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
