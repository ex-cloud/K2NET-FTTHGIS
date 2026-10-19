package com.company.ftthgis.service;

import com.company.ftthgis.api.system.dto.CreatePackageRequest;
import com.company.ftthgis.api.system.dto.PackageKpiOverviewDto;
import com.company.ftthgis.api.system.dto.UpdatePackageRequest;
import com.company.ftthgis.api.tenant.dto.PackageResponseDto;
import com.company.ftthgis.domain.tenant.entity.PackageBillingType;
import com.company.ftthgis.domain.tenant.entity.PackageCategory;
import com.company.ftthgis.domain.tenant.entity.PackageSubscriptionStatus;
import com.company.ftthgis.domain.tenant.entity.PlatformPackage;
import com.company.ftthgis.domain.tenant.entity.TenantPackageSubscription;
import com.company.ftthgis.domain.tenant.repository.PlatformPackageRepository;
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
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlatformPackageServiceTest {

    @Mock
    private PlatformPackageRepository packageRepository;

    @Mock
    private TenantPackageSubscriptionRepository subscriptionRepository;

    @Mock
    private PackageEligibilityService eligibilityService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private PlatformPackageService packageService;

    private PlatformPackage samplePackage;

    @BeforeEach
    void setUp() {
        samplePackage = PlatformPackage.builder()
                .id(UUID.randomUUID())
                .code("PKG_BOOSTER_OLT_5")
                .name("Booster +5 OLT")
                .category(PackageCategory.CAPACITY_BOOSTER)
                .billingType(PackageBillingType.RECURRING_MONTHLY)
                .priceMonthly(BigDecimal.valueOf(500000))
                .minPlanTier("FREE")
                .prerequisiteCodes("[]")
                .conflictCodes("[]")
                .quotaDeltaJson("{\"deltaOlts\": 5}")
                .isPublished(true)
                .sortOrder(1)
                .build();
    }

    @Test
    @DisplayName("createPackage should save and return package response DTO")
    void testCreatePackageSuccess() {
        CreatePackageRequest request = CreatePackageRequest.builder()
                .code("PKG_CUSTOM_TEST")
                .name("Custom Test Pack")
                .category(PackageCategory.TELEMETRY)
                .priceMonthly(BigDecimal.valueOf(600000))
                .minPlanTier("STARTER")
                .build();

        when(packageRepository.existsByCode(eq("PKG_CUSTOM_TEST"))).thenReturn(false);
        when(packageRepository.save(any(PlatformPackage.class))).thenAnswer(invocation -> {
            PlatformPackage p = invocation.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });

        PackageResponseDto response = packageService.createPackage(request);

        assertNotNull(response);
        assertEquals("PKG_CUSTOM_TEST", response.getCode());
        assertEquals("Custom Test Pack", response.getName());
        assertEquals(PackageCategory.TELEMETRY, response.getCategory());
    }

    @Test
    @DisplayName("createPackage with duplicate code should throw HTTP 409 conflict exception")
    void testCreatePackageDuplicateCode() {
        CreatePackageRequest request = CreatePackageRequest.builder()
                .code("PKG_BOOSTER_OLT_5")
                .name("Duplicate Booster")
                .category(PackageCategory.CAPACITY_BOOSTER)
                .priceMonthly(BigDecimal.valueOf(500000))
                .build();

        when(packageRepository.existsByCode(eq("PKG_BOOSTER_OLT_5"))).thenReturn(true);

        assertThrows(ResponseStatusException.class, () -> packageService.createPackage(request));
    }

    @Test
    @DisplayName("togglePublish should invert isPublished state")
    void testTogglePublish() {
        UUID id = samplePackage.getId();
        when(packageRepository.findById(eq(id))).thenReturn(Optional.of(samplePackage));
        when(packageRepository.save(any(PlatformPackage.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PackageResponseDto response = packageService.togglePublish(id);

        assertNotNull(response);
        assertFalse(response.isPublished());
    }

    @Test
    @DisplayName("getKpiOverview should compute aggregated totals and MRR accurately")
    void testGetKpiOverview() {
        when(packageRepository.count()).thenReturn(10L);
        when(packageRepository.countByIsPublishedTrue()).thenReturn(8L);
        when(subscriptionRepository.countDistinctActiveTenants()).thenReturn(5L);

        TenantPackageSubscription sub1 = TenantPackageSubscription.builder()
                .platformPackage(samplePackage)
                .status(PackageSubscriptionStatus.ACTIVE)
                .build();

        when(subscriptionRepository.findAll()).thenReturn(List.of(sub1));

        PackageKpiOverviewDto overview = packageService.getKpiOverview();

        assertNotNull(overview);
        assertEquals(10L, overview.getTotalPackages());
        assertEquals(8L, overview.getPublishedPackages());
        assertEquals(1L, overview.getActiveSubscriptions());
        assertEquals(5L, overview.getDistinctSubscribedTenants());
        assertEquals(BigDecimal.valueOf(500000), overview.getEstimatedAddonMrr());
    }

    @Test
    @DisplayName("getPublishedPackages should only return packages with lifecycle PUBLISHED and isPublished true")
    void testGetPublishedPackagesOnly() {
        PlatformPackage publishedPkg = PlatformPackage.builder()
                .id(UUID.randomUUID())
                .code("PKG_BOOSTER_OLT_5")
                .name("OLT Booster")
                .category(PackageCategory.CAPACITY_BOOSTER)
                .isPublished(true)
                .lifecycleStatus("PUBLISHED")
                .build();

        PlatformPackage unpublishedPublishedStatus = PlatformPackage.builder()
                .id(UUID.randomUUID())
                .code("PKG_DRAFT_PKG")
                .name("Draft Package")
                .category(PackageCategory.SPATIAL_AI)
                .isPublished(false)
                .lifecycleStatus("PUBLISHED")
                .build();

        when(packageRepository.findByLifecycleStatusOrderBySortOrderAsc("PUBLISHED"))
                .thenReturn(List.of(publishedPkg, unpublishedPublishedStatus));

        List<PackageResponseDto> result = packageService.getPublishedPackages();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("PKG_BOOSTER_OLT_5", result.get(0).getCode());
    }

    @Test
    @DisplayName("getPackagesByLifecycle should filter by lifecycle status accurately")
    void testGetPackagesByLifecycle() {
        PlatformPackage draftPkg = PlatformPackage.builder()
                .id(UUID.randomUUID())
                .code("PKG_AI_OTDR")
                .name("AI OTDR")
                .category(PackageCategory.SPATIAL_AI)
                .isPublished(false)
                .lifecycleStatus("DRAFT")
                .build();

        when(packageRepository.findByLifecycleStatusOrderBySortOrderAsc("DRAFT"))
                .thenReturn(List.of(draftPkg));

        List<PackageResponseDto> draftResult = packageService.getPackagesByLifecycle("DRAFT");
        assertEquals(1, draftResult.size());
        assertEquals("PKG_AI_OTDR", draftResult.get(0).getCode());

        when(packageRepository.findAllByOrderBySortOrderAsc())
                .thenReturn(List.of(samplePackage, draftPkg));

        List<PackageResponseDto> allResult = packageService.getPackagesByLifecycle("ALL");
        assertEquals(2, allResult.size());
    }
}
