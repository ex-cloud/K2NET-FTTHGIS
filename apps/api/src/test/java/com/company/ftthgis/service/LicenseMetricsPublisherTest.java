package com.company.ftthgis.service;

import com.company.ftthgis.domain.network.repository.NetworkNodeRepository;
import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.domain.tenant.repository.OrganizationConfigRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LicenseMetricsPublisherTest {

    private MeterRegistry meterRegistry;

    @Mock
    private TenantLicenseRepository tenantLicenseRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationConfigRepository organizationConfigRepository;

    @Mock
    private ProjectQuotaService projectQuotaService;

    @Mock
    private NetworkNodeRepository networkNodeRepository;

    private LicenseMetricsPublisher publisher;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        publisher = new LicenseMetricsPublisher(
                meterRegistry,
                tenantLicenseRepository,
                organizationRepository,
                organizationConfigRepository,
                projectQuotaService,
                networkNodeRepository
        );
    }

    @Test
    @DisplayName("publishMetrics correctly registers days remaining, status flag, and quota utilization")
    void testPublishMetrics_Success() {
        UUID orgId1 = UUID.randomUUID();
        Organization org1 = Organization.builder()
                .id(orgId1)
                .name("ISP Mitra Sejahtera")
                .slug("isp-mitra")
                .build();

        SubscriptionPlan proPlan = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .name("PRO")
                .price(BigDecimal.valueOf(3900000))
                .maxProjects(6)
                .maxOdps(2500)
                .build();

        TenantLicense lic1 = TenantLicense.builder()
                .id(UUID.randomUUID())
                .organization(org1)
                .subscriptionPlan(proPlan)
                .status(LicenseStatus.ACTIVE)
                .validFrom(LocalDateTime.now().minusDays(10))
                .validUntil(LocalDateTime.now().plusDays(20))
                .build();

        UUID orgId2 = UUID.randomUUID();
        Organization org2 = Organization.builder()
                .id(orgId2)
                .name("ISP Cepat Net")
                .slug("cepat-net")
                .build();

        SubscriptionPlan starterPlan = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .name("STARTER")
                .price(BigDecimal.valueOf(1500000))
                .maxProjects(2)
                .maxOdps(300)
                .build();

        TenantLicense lic2 = TenantLicense.builder()
                .id(UUID.randomUUID())
                .organization(org2)
                .subscriptionPlan(starterPlan)
                .status(LicenseStatus.ACTIVE)
                .validFrom(LocalDateTime.now().minusDays(27))
                .validUntil(LocalDateTime.now().plusDays(3)) // Expiring soon (<7 days)
                .build();

        when(tenantLicenseRepository.findAll()).thenReturn(List.of(lic1, lic2));
        when(projectQuotaService.getUsedActiveProjects(orgId1)).thenReturn(3L); // 3 / 6 = 0.5
        when(networkNodeRepository.countBillableOdpsByOrganizationId(orgId1)).thenReturn(1250L); // 1250 / 2500 = 0.5

        when(projectQuotaService.getUsedActiveProjects(orgId2)).thenReturn(2L); // 2 / 2 = 1.0
        when(networkNodeRepository.countBillableOdpsByOrganizationId(orgId2)).thenReturn(150L); // 150 / 300 = 0.5

        // Execute publish
        publisher.publishMetrics();

        // Verify days remaining gauge
        Double daysRemainingOrg1 = meterRegistry.get("ftth_license_days_remaining")
                .tag("tenant_slug", "isp-mitra")
                .tag("plan", "PRO")
                .gauge()
                .value();
        assertThat(daysRemainingOrg1).isNotNull();
        assertThat(daysRemainingOrg1).isGreaterThanOrEqualTo(19.0);

        Double daysRemainingOrg2 = meterRegistry.get("ftth_license_days_remaining")
                .tag("tenant_slug", "cepat-net")
                .tag("plan", "STARTER")
                .gauge()
                .value();
        assertThat(daysRemainingOrg2).isNotNull();
        assertThat(daysRemainingOrg2).isGreaterThanOrEqualTo(2.0);

        // Verify status indicator gauge
        Double statusOrg1 = meterRegistry.get("ftth_license_status")
                .tag("tenant_slug", "isp-mitra")
                .tag("status", "ACTIVE")
                .gauge()
                .value();
        assertThat(statusOrg1).isEqualTo(1.0);

        // Verify quota utilization ratio
        Double oltRatioOrg1 = meterRegistry.get("ftth_hardware_quota_utilization_ratio")
                .tag("tenant_slug", "isp-mitra")
                .tag("resource", "olt")
                .gauge()
                .value();
        assertThat(oltRatioOrg1).isEqualTo(0.5);

        Double oltRatioOrg2 = meterRegistry.get("ftth_hardware_quota_utilization_ratio")
                .tag("tenant_slug", "cepat-net")
                .tag("resource", "olt")
                .gauge()
                .value();
        assertThat(oltRatioOrg2).isEqualTo(1.0);

        // Verify platform aggregates
        Double expiringSoon = meterRegistry.get("ftth_platform_licenses_expiring_soon_count")
                .gauge()
                .value();
        assertThat(expiringSoon).isEqualTo(1.0); // Only org2 expires in <= 7 days

        Double mrr = meterRegistry.get("ftth_platform_monthly_recurring_revenue_idr")
                .gauge()
                .value();
        assertThat(mrr).isEqualTo(5400000.0); // 3,900,000 + 1,500,000
    }
}
