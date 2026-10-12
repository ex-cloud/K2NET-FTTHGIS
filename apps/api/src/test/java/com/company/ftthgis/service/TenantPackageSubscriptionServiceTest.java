package com.company.ftthgis.service;

import com.company.ftthgis.api.system.dto.GrantPackageRequest;
import com.company.ftthgis.api.tenant.dto.OrderPackageRequest;
import com.company.ftthgis.api.tenant.dto.OrderPackageResponseDto;
import com.company.ftthgis.api.tenant.dto.PackageEligibilityDto;
import com.company.ftthgis.api.tenant.dto.TenantPackageSubscriptionDto;
import com.company.ftthgis.domain.tenant.entity.*;
import com.company.ftthgis.domain.tenant.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantPackageSubscriptionServiceTest {

    @Mock
    private PlatformPackageRepository packageRepository;

    @Mock
    private TenantPackageSubscriptionRepository subscriptionRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private TenantLicenseRepository tenantLicenseRepository;

    @Mock
    private BillingInvoiceRepository billingInvoiceRepository;

    @Mock
    private PackageEligibilityService eligibilityService;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    @InjectMocks
    private TenantPackageSubscriptionService subscriptionService;

    private Organization org;
    private PlatformPackage pkg;
    private TenantLicense license;

    @BeforeEach
    void setUp() {
        org = Organization.builder()
                .id(UUID.randomUUID())
                .name("K2 Net Solusi")
                .slug("k2net-solusi")
                .build();

        pkg = PlatformPackage.builder()
                .id(UUID.randomUUID())
                .code("PKG_OLT_POLLER")
                .name("OLT Live Telemetry Pack")
                .category(PackageCategory.TELEMETRY)
                .billingType(PackageBillingType.RECURRING_MONTHLY)
                .priceMonthly(BigDecimal.valueOf(450000))
                .minPlanTier("STARTER")
                .prerequisiteCodes("[]")
                .conflictCodes("[]")
                .build();

        license = TenantLicense.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .status(LicenseStatus.ACTIVE)
                .validFrom(LocalDateTime.now())
                .validUntil(LocalDateTime.now().plusMonths(1))
                .build();
    }

    @Test
    @DisplayName("orderPackage should calculate invoice, activate subscription, and evict Redis cache")
    void testOrderPackageSuccess() {
        OrderPackageRequest request = OrderPackageRequest.builder()
                .packageId(pkg.getId())
                .paymentMethod("XENDIT_QRIS")
                .build();

        when(organizationRepository.findById(eq(org.getId()))).thenReturn(Optional.of(org));
        when(packageRepository.findById(eq(pkg.getId()))).thenReturn(Optional.of(pkg));
        when(eligibilityService.evaluateEligibility(eq(org), eq(pkg)))
                .thenReturn(PackageEligibilityDto.builder().isEligible(true).eligibilityState("READY").build());
        when(tenantLicenseRepository.findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(eq(org.getId()), eq(LicenseStatus.ACTIVE)))
                .thenReturn(Optional.of(license));
        when(subscriptionRepository.findByOrganizationIdAndPlatformPackageId(eq(org.getId()), eq(pkg.getId())))
                .thenReturn(Optional.empty());

        when(billingInvoiceRepository.save(any(BillingInvoice.class))).thenAnswer(invocation -> {
            BillingInvoice inv = invocation.getArgument(0);
            inv.setId(UUID.randomUUID());
            return inv;
        });

        when(subscriptionRepository.save(any(TenantPackageSubscription.class))).thenAnswer(invocation -> {
            TenantPackageSubscription s = invocation.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        OrderPackageResponseDto response = subscriptionService.orderPackage(org.getId(), request, "admin@k2net.id");

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertNotNull(response.getInvoiceId());
        assertEquals("IDR", response.getCurrency());
        // Verify Redis eviction called
        verify(redisTemplate, atLeastOnce()).delete(argThat((java.util.Collection<String> keys) ->
                keys.contains("tenant:packages:" + org.getId())));
    }

    @Test
    @DisplayName("grantPackageManually should activate POC trial with custom duration by admin")
    void testGrantPackageManually() {
        GrantPackageRequest request = GrantPackageRequest.builder()
                .packageId(pkg.getId())
                .durationDays(14)
                .grantNotes("POC Uji Coba Telemetri 14 Hari")
                .build();

        when(organizationRepository.findById(eq(org.getId()))).thenReturn(Optional.of(org));
        when(packageRepository.findById(eq(pkg.getId()))).thenReturn(Optional.of(pkg));
        when(subscriptionRepository.findByOrganizationIdAndPlatformPackageId(eq(org.getId()), eq(pkg.getId())))
                .thenReturn(Optional.empty());
        when(subscriptionRepository.save(any(TenantPackageSubscription.class))).thenAnswer(invocation -> {
            TenantPackageSubscription s = invocation.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        TenantPackageSubscriptionDto result = subscriptionService.grantPackageManually(org.getId(), request, "super_admin_andi");

        assertNotNull(result);
        assertEquals(PackageSubscriptionStatus.ACTIVE, result.getStatus());
        assertEquals("ADMIN_MANUAL", result.getGrantedBy());
        assertTrue(result.getGrantNotes().contains("super_admin_andi"));
        assertFalse(result.isAutoRenew());
        assertNotNull(result.getExpiresAt());
        verify(redisTemplate, atLeastOnce()).delete(argThat((java.util.Collection<String> keys) ->
                keys.contains("tenant:packages:" + org.getId())));
    }

    @Test
    @DisplayName("cancelAutoRenew should disable auto renewal flag")
    void testCancelAutoRenew() {
        UUID subId = UUID.randomUUID();
        TenantPackageSubscription existingSub = TenantPackageSubscription.builder()
                .id(subId)
                .organization(org)
                .platformPackage(pkg)
                .status(PackageSubscriptionStatus.ACTIVE)
                .autoRenew(true)
                .build();

        when(subscriptionRepository.findById(eq(subId))).thenReturn(Optional.of(existingSub));
        when(subscriptionRepository.save(any(TenantPackageSubscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TenantPackageSubscriptionDto result = subscriptionService.cancelAutoRenew(subId, org.getId());

        assertNotNull(result);
        assertFalse(result.isAutoRenew());
    }
}
