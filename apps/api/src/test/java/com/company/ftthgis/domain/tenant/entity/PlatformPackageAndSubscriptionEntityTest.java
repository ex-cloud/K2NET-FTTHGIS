package com.company.ftthgis.domain.tenant.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class PlatformPackageAndSubscriptionEntityTest {

    @Test
    @DisplayName("PlatformPackage builder should set default values and helper methods correctly")
    void testPlatformPackageCreationAndDefaults() {
        PlatformPackage pkg = PlatformPackage.builder()
                .code("PKG_OLT_POLLER")
                .name("OLT Live Telemetry Pack")
                .category(PackageCategory.TELEMETRY)
                .priceMonthly(BigDecimal.valueOf(450000))
                .minPlanTier("STARTER")
                .featureKey("feature.telemetry.olt_poller")
                .build();

        assertNotNull(pkg);
        assertEquals("PKG_OLT_POLLER", pkg.getCode());
        assertEquals(PackageCategory.TELEMETRY, pkg.getCategory());
        assertEquals(PackageBillingType.RECURRING_MONTHLY, pkg.getBillingType());
        assertEquals("STARTER", pkg.getMinPlanTier());
        assertEquals("[]", pkg.getPrerequisiteCodes());
        assertEquals("[]", pkg.getConflictCodes());
        assertEquals("{}", pkg.getQuotaDeltaJson());
        assertTrue(pkg.isPublished());
        assertEquals("Package", pkg.getIconName());
        assertEquals(0, pkg.getSortOrder());
        assertFalse(pkg.isCapacityBooster());
        assertFalse(pkg.isOneTime());
    }

    @Test
    @DisplayName("PlatformPackage should accurately identify Capacity Booster and One-Time types")
    void testPlatformPackageBoosterAndOneTime() {
        PlatformPackage booster = PlatformPackage.builder()
                .code("PKG_BOOSTER_OLT_5")
                .name("Booster +5 OLT")
                .category(PackageCategory.CAPACITY_BOOSTER)
                .billingType(PackageBillingType.RECURRING_MONTHLY)
                .quotaDeltaJson("{\"deltaOlts\": 5}")
                .build();

        assertTrue(booster.isCapacityBooster());
        assertFalse(booster.isOneTime());

        PlatformPackage oneTimeSetup = PlatformPackage.builder()
                .code("PKG_TENANT_BRANDING")
                .name("Whitelabel Branding")
                .category(PackageCategory.WHITE_LABEL)
                .billingType(PackageBillingType.ONE_TIME)
                .build();

        assertFalse(oneTimeSetup.isCapacityBooster());
        assertTrue(oneTimeSetup.isOneTime());
    }

    @Test
    @DisplayName("TenantPackageSubscription should accurately evaluate isActive and isExpired status")
    void testTenantPackageSubscriptionLifecycle() {
        LocalDateTime now = LocalDateTime.now();
        Organization org = Organization.builder().id(UUID.randomUUID()).slug("isp-mitra").build();
        PlatformPackage pkg = PlatformPackage.builder().id(UUID.randomUUID()).code("PKG_AI_OTDR").build();

        // 1. Active recurring subscription
        TenantPackageSubscription activeSub = TenantPackageSubscription.builder()
                .organization(org)
                .platformPackage(pkg)
                .status(PackageSubscriptionStatus.ACTIVE)
                .activatedAt(now.minusDays(5))
                .expiresAt(now.plusDays(25))
                .build();

        assertTrue(activeSub.isActive());
        assertFalse(activeSub.isExpired());

        // 2. Active permanent one-time subscription (expiresAt is null)
        TenantPackageSubscription permanentSub = TenantPackageSubscription.builder()
                .organization(org)
                .platformPackage(pkg)
                .status(PackageSubscriptionStatus.ACTIVE)
                .activatedAt(now.minusDays(10))
                .expiresAt(null)
                .build();

        assertTrue(permanentSub.isActive());
        assertFalse(permanentSub.isExpired());

        // 3. Expired subscription by status
        TenantPackageSubscription expiredByStatus = TenantPackageSubscription.builder()
                .organization(org)
                .platformPackage(pkg)
                .status(PackageSubscriptionStatus.EXPIRED)
                .activatedAt(now.minusDays(40))
                .expiresAt(now.minusDays(10))
                .build();

        assertFalse(expiredByStatus.isActive());
        assertTrue(expiredByStatus.isExpired());

        // 4. Expired subscription by date (even if status flag hasn't been swept yet)
        TenantPackageSubscription expiredByDate = TenantPackageSubscription.builder()
                .organization(org)
                .platformPackage(pkg)
                .status(PackageSubscriptionStatus.ACTIVE)
                .activatedAt(now.minusDays(35))
                .expiresAt(now.minusDays(2))
                .build();

        assertFalse(expiredByDate.isActive(), "Subscription past expiresAt must evaluate to inactive");
        assertTrue(expiredByDate.isExpired(), "Subscription past expiresAt must evaluate to expired");
    }
}
