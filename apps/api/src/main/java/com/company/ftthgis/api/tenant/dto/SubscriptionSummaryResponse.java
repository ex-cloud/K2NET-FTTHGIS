package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionSummaryResponse {
    private String orgId;
    private String orgName;
    private String orgSlug;
    private String status;
    private String planTier;
    private String planName;
    private BigDecimal planPrice;
    private String planCycle;

    // Hardware Quotas & Live Usage
    private int maxOlts;
    private int usedOlts;
    private int maxOdps;
    private int usedOdps;
    private int maxStorageGb;
    private double usedStorageGb;
    private int apiRateLimitMax;
    private int apiRateLimitUsed;

    // Emergency Quota Booster
    private boolean isBoosterActive;
    private int boosterOlts;
    private int boosterOdps;
    private LocalDateTime boosterExpiresAt;
    private long boosterDaysRemaining;
    private int effectiveMaxOlts;
    private int effectiveMaxOdps;

    // Lifecycle & Dunning
    private LocalDateTime trialExpiresAt;
    private boolean isTrialExpired;
    private long trialDaysRemaining;
    private LocalDateTime gracePeriodUntil;
    private int dunningLevel;
    private boolean isOverQuota;
    private boolean isSoftLocked;
}
