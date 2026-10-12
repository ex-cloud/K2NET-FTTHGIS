package com.company.ftthgis.service;

import com.company.ftthgis.api.tenant.dto.PackageEligibilityDto;
import com.company.ftthgis.domain.tenant.entity.*;
import com.company.ftthgis.domain.tenant.repository.PlatformPackageRepository;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import com.company.ftthgis.domain.tenant.repository.TenantPackageSubscriptionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PackageEligibilityServiceTest {

    @Mock
    private TenantLicenseRepository tenantLicenseRepository;

    @Mock
    private TenantPackageSubscriptionRepository subscriptionRepository;

    @Mock
    private PlatformPackageRepository packageRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private PackageEligibilityService eligibilityService;

    private Organization org;
    private SubscriptionPlan starterPlan;
    private TenantLicense activeLicense;
    private PlatformPackage oltPollerPackage;
    private PlatformPackage aiOtdrPackage;

    @BeforeEach
    void setUp() {
        starterPlan = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .name("STARTER")
                .build();

        org = Organization.builder()
                .id(UUID.randomUUID())
                .name("Mitra ISP Net")
                .slug("mitra-isp")
                .subscriptionPlan(starterPlan)
                .build();

        activeLicense = TenantLicense.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .subscriptionPlan(starterPlan)
                .status(LicenseStatus.ACTIVE)
                .validFrom(LocalDateTime.now().minusDays(10))
                .validUntil(LocalDateTime.now().plusDays(20))
                .build();

        oltPollerPackage = PlatformPackage.builder()
                .id(UUID.randomUUID())
                .code("PKG_OLT_POLLER")
                .name("OLT Live Telemetry Pack")
                .minPlanTier("STARTER")
                .prerequisiteCodes("[]")
                .conflictCodes("[]")
                .priceMonthly(BigDecimal.valueOf(450000))
                .build();

        aiOtdrPackage = PlatformPackage.builder()
                .id(UUID.randomUUID())
                .code("PKG_AI_OTDR")
                .name("AI Optical Fault Localizer")
                .minPlanTier("PRO")
                .prerequisiteCodes("[\"PKG_OLT_POLLER\"]")
                .conflictCodes("[]")
                .priceMonthly(BigDecimal.valueOf(1250000))
                .build();
    }

    @Test
    @DisplayName("Lapis 1: Reject order if tenant plan tier is lower than min_plan_tier")
    void testLapis1PlanTierIncompatibility() {
        // Tenant is on STARTER (rank 1), AI OTDR requires PRO (rank 2)
        when(subscriptionRepository.findActiveSubscriptionsByOrganizationId(eq(org.getId()), any()))
                .thenReturn(Collections.emptyList());

        PackageEligibilityDto result = eligibilityService.evaluateEligibility(org, aiOtdrPackage);

        assertNotNull(result);
        assertFalse(result.isEligible());
        assertEquals("PLAN_UPGRADE_REQUIRED", result.getEligibilityState());
        assertEquals("PRO", result.getMinRequiredPlan());
        assertEquals("STARTER", result.getCurrentPlan());
        assertTrue(result.getMessage().contains("STARTER"));
    }

    @Test
    @DisplayName("Lapis 2: Reject order if tenant license status is not ACTIVE (Grace Period / Unhealthy)")
    void testLapis2LicenseUnhealthy() {
        // Tenant upgraded to PRO, but license is in GRACE_PERIOD
        SubscriptionPlan proPlan = SubscriptionPlan.builder().name("PRO").build();
        org.setSubscriptionPlan(proPlan);

        TenantLicense graceLicense = TenantLicense.builder()
                .organization(org)
                .status(LicenseStatus.GRACE_PERIOD)
                .build();

        when(subscriptionRepository.findActiveSubscriptionsByOrganizationId(eq(org.getId()), any()))
                .thenReturn(Collections.emptyList());
        when(tenantLicenseRepository.findFirstByOrganizationIdOrderByCreatedAtDesc(eq(org.getId())))
                .thenReturn(Optional.of(graceLicense));

        PackageEligibilityDto result = eligibilityService.evaluateEligibility(org, oltPollerPackage);

        assertNotNull(result);
        assertFalse(result.isEligible());
        assertEquals("LICENSE_UNHEALTHY", result.getEligibilityState());
        assertEquals("GRACE_PERIOD", result.getLicenseStatus());
    }

    @Test
    @DisplayName("Lapis 3: Identify missing prerequisite packages and suggest bundle")
    void testLapis3MissingPrerequisites() {
        SubscriptionPlan proPlan = SubscriptionPlan.builder().name("PRO").build();
        org.setSubscriptionPlan(proPlan);

        when(subscriptionRepository.findActiveSubscriptionsByOrganizationId(eq(org.getId()), any()))
                .thenReturn(Collections.emptyList());
        when(tenantLicenseRepository.findFirstByOrganizationIdOrderByCreatedAtDesc(eq(org.getId())))
                .thenReturn(Optional.of(activeLicense));

        PackageEligibilityDto result = eligibilityService.evaluateEligibility(org, aiOtdrPackage);

        assertNotNull(result);
        assertFalse(result.isEligible());
        assertEquals("PREREQUISITE_REQUIRED", result.getEligibilityState());
        assertNotNull(result.getMissingPrerequisites());
        assertTrue(result.getMissingPrerequisites().contains("PKG_OLT_POLLER"));
    }

    @Test
    @DisplayName("Lapis 3: Pass prerequisite check if prerequisite package is already actively subscribed")
    void testLapis3PrerequisiteSatisfiedViaActiveSubscription() {
        SubscriptionPlan proPlan = SubscriptionPlan.builder().name("PRO").build();
        org.setSubscriptionPlan(proPlan);

        TenantPackageSubscription activeOltSub = TenantPackageSubscription.builder()
                .organization(org)
                .platformPackage(oltPollerPackage)
                .status(PackageSubscriptionStatus.ACTIVE)
                .activatedAt(LocalDateTime.now().minusDays(5))
                .expiresAt(LocalDateTime.now().plusDays(25))
                .build();

        when(subscriptionRepository.findActiveSubscriptionsByOrganizationId(eq(org.getId()), any()))
                .thenReturn(List.of(activeOltSub));
        when(tenantLicenseRepository.findFirstByOrganizationIdOrderByCreatedAtDesc(eq(org.getId())))
                .thenReturn(Optional.of(activeLicense));

        PackageEligibilityDto result = eligibilityService.evaluateEligibility(org, aiOtdrPackage);

        assertNotNull(result);
        assertTrue(result.isEligible());
        assertEquals("READY", result.getEligibilityState());
    }

    @Test
    @DisplayName("Recognize already active package and return ALREADY_ACTIVE")
    void testAlreadyActivePackage() {
        TenantPackageSubscription activeSub = TenantPackageSubscription.builder()
                .organization(org)
                .platformPackage(oltPollerPackage)
                .status(PackageSubscriptionStatus.ACTIVE)
                .build();

        when(subscriptionRepository.findActiveSubscriptionsByOrganizationId(eq(org.getId()), any()))
                .thenReturn(List.of(activeSub));

        PackageEligibilityDto result = eligibilityService.evaluateEligibility(org, oltPollerPackage);

        assertNotNull(result);
        assertFalse(result.isEligible());
        assertEquals("ALREADY_ACTIVE", result.getEligibilityState());
    }
}
