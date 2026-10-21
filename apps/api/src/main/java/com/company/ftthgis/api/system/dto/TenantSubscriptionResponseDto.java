package com.company.ftthgis.api.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantSubscriptionResponseDto {
    private UUID id;
    private UUID organizationId;
    private String organizationName;
    private String organizationSlug;
    private UUID planVersionId;
    private String planName;
    private String version;
    private String status;
    private String billingCycle;
    private LocalDateTime currentPeriodStart;
    private LocalDateTime currentPeriodEnd;
    private LocalDateTime gracePeriodEnd;
    private boolean test;
    private java.math.BigDecimal priceMonthly;
    private java.math.BigDecimal priceYearly;
    private String currency;
    private String billingContactName;
    private String billingContactEmail;
    private String billingContactPhone;

    // Overrides
    private Integer overrideMaxProjects;
    private Integer overrideMaxArchivedProjects;
    private Integer overrideMaxOlts;
    private Integer overrideMaxOdcs;
    private Integer overrideMaxOdps;
    private Integer overrideMaxCustomers;
    private Integer overrideMaxStorageGb;
    private Integer overrideApiRateLimitRpm;

    // Entitlements
    private boolean featureSsoEnabled;
    private boolean featureApiEnabled;
    private boolean featureAiCopilotEnabled;
    private boolean featureCustomDomainEnabled;

    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
