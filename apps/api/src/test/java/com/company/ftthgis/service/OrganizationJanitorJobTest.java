package com.company.ftthgis.service;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.repository.OrganizationConfigRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;

@ExtendWith(MockitoExtension.class)
class OrganizationJanitorJobTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationConfigRepository organizationConfigRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private OrganizationService organizationService;

    @Mock
    private TenantLicenseRepository tenantLicenseRepository;

    @Mock
    private LicenseNotificationService licenseNotificationService;

    @InjectMocks
    private OrganizationJanitorJob janitorJob;

    @Test
    @DisplayName("Phase 1 -> Phase 2: Active trial passed 14 days should transition to TRIAL_EXPIRED with 16 days grace period")
    void testTrialExpiryTransitionToGracePeriod() {
        LocalDateTime now = LocalDateTime.now();
        SubscriptionPlan freePlan = SubscriptionPlan.builder().name("FREE").build();

        Organization trialOrg = Organization.builder()
                .id(UUID.randomUUID())
                .name("Trial Tenant")
                .slug("trial-tenant-1234567890")
                .status(Organization.OrganizationStatus.TRIAL)
                .subscriptionPlan(freePlan)
                .trialExpiresAt(now.minusDays(1)) // Expired yesterday
                .build();

        when(organizationRepository.findAll()).thenReturn(List.of(trialOrg));

        janitorJob.sweepTenantLifecycle();

        assertEquals(Organization.OrganizationStatus.TRIAL_EXPIRED, trialOrg.getStatus());
        assertNotNull(trialOrg.getGracePeriodUntil());
        assertTrue(trialOrg.getGracePeriodUntil().isAfter(now.plusDays(15)));
        verify(organizationRepository).save(trialOrg);
        verifyNoInteractions(organizationService);
    }

    @Test
    @DisplayName("Phase 2 -> Phase 3: TRIAL_EXPIRED tenant with elapsed grace period (>30 days) triggers automated nuclear purge")
    void testTrialExpiredCutOffTriggersNuclearPurge() {
        LocalDateTime now = LocalDateTime.now();
        SubscriptionPlan freePlan = SubscriptionPlan.builder().name("FREE").build();

        Organization expiredOrg = Organization.builder()
                .id(UUID.randomUUID())
                .name("Inactive Abandoned Org")
                .slug("abandoned-1234567890")
                .status(Organization.OrganizationStatus.TRIAL_EXPIRED)
                .subscriptionPlan(freePlan)
                .trialExpiresAt(now.minusDays(17))
                .gracePeriodUntil(now.minusDays(1)) // Grace period elapsed
                .build();

        when(organizationRepository.findAll()).thenReturn(List.of(expiredOrg));

        janitorJob.sweepTenantLifecycle();

        verify(organizationService).purgeOrganizationInternally(eq(expiredOrg), contains("Automated 30-Day Free Trial Inactivity Cut-off Purge"));
    }

    @Test
    @DisplayName("Root platform organization (default) is protected from auto-purge even if grace period elapsed")
    void testRootOrganizationProtectionFromAutoPurge() {
        LocalDateTime now = LocalDateTime.now();
        Organization rootOrg = Organization.builder()
                .id(UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .name("Root Organization")
                .slug("default")
                .status(Organization.OrganizationStatus.TRIAL_EXPIRED)
                .gracePeriodUntil(now.minusDays(1))
                .build();

        when(organizationRepository.findAll()).thenReturn(List.of(rootOrg));

        janitorJob.sweepTenantLifecycle();

        verifyNoInteractions(organizationService);
    }

    @Test
    @DisplayName("Paid plan tenant is protected from free trial auto-purge")
    void testPaidPlanProtectionFromAutoPurge() {
        LocalDateTime now = LocalDateTime.now();
        SubscriptionPlan proPlan = SubscriptionPlan.builder().name("PRO").build();

        Organization paidOrg = Organization.builder()
                .id(UUID.randomUUID())
                .name("Pro Tenant")
                .slug("pro-tenant-01")
                .status(Organization.OrganizationStatus.TRIAL_EXPIRED)
                .subscriptionPlan(proPlan)
                .gracePeriodUntil(now.minusDays(1))
                .build();

        when(organizationRepository.findAll()).thenReturn(List.of(paidOrg));

        janitorJob.sweepTenantLifecycle();

        verifyNoInteractions(organizationService);
    }

    @Test
    @DisplayName("License Lifecycle: Expired ACTIVE license transitions to GRACE_PERIOD (7 days)")
    void testLicenseExpiryTransitionsToGracePeriod() {
        LocalDateTime now = LocalDateTime.now();
        Organization org = Organization.builder()
                .id(UUID.randomUUID())
                .slug("tenant-alpha")
                .status(Organization.OrganizationStatus.ACTIVE)
                .build();

        TenantLicense activeLicense = TenantLicense.builder()
                .id(UUID.randomUUID())
                .licenseKey("K2NET-PRO-12345678-ABCD")
                .organization(org)
                .status(LicenseStatus.ACTIVE)
                .validUntil(now.minusHours(1))
                .build();

        when(tenantLicenseRepository.findByStatusAndValidUntilBetween(any(), any(), any()))
                .thenReturn(List.of());
        when(tenantLicenseRepository.findByValidUntilBeforeAndStatus(any(), eq(LicenseStatus.ACTIVE)))
                .thenReturn(List.of(activeLicense));
        when(tenantLicenseRepository.findByGracePeriodUntilBeforeAndStatus(any(), eq(LicenseStatus.GRACE_PERIOD)))
                .thenReturn(List.of());
        when(tenantLicenseRepository.findByStatus(eq(LicenseStatus.RESTRICTED_READ_ONLY)))
                .thenReturn(List.of());

        janitorJob.sweepLicenseLifecycle(now);

        assertEquals(LicenseStatus.GRACE_PERIOD, activeLicense.getStatus());
        assertNotNull(activeLicense.getGracePeriodUntil());
        assertTrue(activeLicense.getGracePeriodUntil().isAfter(now.plusDays(6)));
        verify(tenantLicenseRepository).save(activeLicense);
        verify(licenseNotificationService).dispatchLicenseReminder(
                eq(activeLicense), eq(com.company.ftthgis.domain.tenant.entity.LicenseNotificationStage.GRACE_PERIOD), anyString()
        );
    }

    @Test
    @DisplayName("License Lifecycle: Expired GRACE_PERIOD license transitions to RESTRICTED_READ_ONLY and sets org overQuotaMode")
    void testLicenseGracePeriodExpiryTransitionsToRestrictedReadOnly() {
        LocalDateTime now = LocalDateTime.now();
        Organization org = Organization.builder()
                .id(UUID.randomUUID())
                .slug("tenant-beta")
                .status(Organization.OrganizationStatus.ACTIVE)
                .overQuotaMode(false)
                .build();

        TenantLicense graceLicense = TenantLicense.builder()
                .id(UUID.randomUUID())
                .licenseKey("K2NET-PRO-87654321-DCBA")
                .organization(org)
                .status(LicenseStatus.GRACE_PERIOD)
                .validUntil(now.minusDays(8))
                .gracePeriodUntil(now.minusMinutes(5))
                .build();

        when(tenantLicenseRepository.findByStatusAndValidUntilBetween(any(), any(), any()))
                .thenReturn(List.of());
        when(tenantLicenseRepository.findByValidUntilBeforeAndStatus(any(), eq(LicenseStatus.ACTIVE)))
                .thenReturn(List.of());
        when(tenantLicenseRepository.findByGracePeriodUntilBeforeAndStatus(any(), eq(LicenseStatus.GRACE_PERIOD)))
                .thenReturn(List.of(graceLicense));
        when(tenantLicenseRepository.findByStatus(eq(LicenseStatus.RESTRICTED_READ_ONLY)))
                .thenReturn(List.of());

        janitorJob.sweepLicenseLifecycle(now);

        assertEquals(LicenseStatus.RESTRICTED_READ_ONLY, graceLicense.getStatus());
        verify(tenantLicenseRepository).save(graceLicense);
        verify(licenseNotificationService).dispatchLicenseReminder(
                eq(graceLicense), eq(com.company.ftthgis.domain.tenant.entity.LicenseNotificationStage.READ_ONLY_LOCKED), anyString()
        );

        assertTrue(org.getOverQuotaMode());
        assertEquals(Organization.OrganizationStatus.OVERDUE, org.getStatus());
        verify(organizationRepository).save(org);
    }

    @Test
    @DisplayName("License Lifecycle: RESTRICTED_READ_ONLY license overdue > 30 days transitions to SUSPENDED")
    void testLicenseRestrictedReadOnlyOverdue30DaysTransitionsToSuspended() {
        LocalDateTime now = LocalDateTime.now();
        Organization org = Organization.builder()
                .id(UUID.randomUUID())
                .slug("tenant-gamma")
                .status(Organization.OrganizationStatus.OVERDUE)
                .build();

        TenantLicense readOnlyLicense = TenantLicense.builder()
                .id(UUID.randomUUID())
                .licenseKey("K2NET-ENT-11223344-9988")
                .organization(org)
                .status(LicenseStatus.RESTRICTED_READ_ONLY)
                .gracePeriodUntil(now.minusDays(31))
                .build();

        when(tenantLicenseRepository.findByStatusAndValidUntilBetween(any(), any(), any()))
                .thenReturn(List.of());
        when(tenantLicenseRepository.findByValidUntilBeforeAndStatus(any(), eq(LicenseStatus.ACTIVE)))
                .thenReturn(List.of());
        when(tenantLicenseRepository.findByGracePeriodUntilBeforeAndStatus(any(), eq(LicenseStatus.GRACE_PERIOD)))
                .thenReturn(List.of());
        when(tenantLicenseRepository.findByStatus(eq(LicenseStatus.RESTRICTED_READ_ONLY)))
                .thenReturn(List.of(readOnlyLicense));

        janitorJob.sweepLicenseLifecycle(now);

        assertEquals(LicenseStatus.SUSPENDED, readOnlyLicense.getStatus());
        verify(tenantLicenseRepository).save(readOnlyLicense);
        verify(licenseNotificationService).dispatchLicenseReminder(
                eq(readOnlyLicense), eq(com.company.ftthgis.domain.tenant.entity.LicenseNotificationStage.SUSPENDED), anyString()
        );

        assertEquals(Organization.OrganizationStatus.SUSPENDED, org.getStatus());
        verify(organizationRepository).save(org);
    }

    @Test
    @DisplayName("License Lifecycle: Proactive reminder H-7 and H-3 dispatched for active licenses")
    void testProactiveRemindersH7AndH3ForActiveLicenses() {
        LocalDateTime now = LocalDateTime.now();
        Organization org = Organization.builder()
                .id(UUID.randomUUID())
                .slug("tenant-reminder")
                .status(Organization.OrganizationStatus.ACTIVE)
                .build();

        TenantLicense licExpiring7D = TenantLicense.builder()
                .id(UUID.randomUUID())
                .licenseKey("K2NET-PRO-7D000000-1111")
                .organization(org)
                .status(LicenseStatus.ACTIVE)
                .validUntil(now.plusDays(5)) // Within 7 days
                .lastNotifiedStage(com.company.ftthgis.domain.tenant.entity.LicenseNotificationStage.NONE)
                .build();

        TenantLicense licExpiring3D = TenantLicense.builder()
                .id(UUID.randomUUID())
                .licenseKey("K2NET-PRO-3D000000-2222")
                .organization(org)
                .status(LicenseStatus.ACTIVE)
                .validUntil(now.plusDays(2)) // Within 3 days
                .lastNotifiedStage(com.company.ftthgis.domain.tenant.entity.LicenseNotificationStage.EXPIRING_7D)
                .build();

        when(tenantLicenseRepository.findByStatusAndValidUntilBetween(any(), any(), any()))
                .thenReturn(List.of(licExpiring7D, licExpiring3D));
        when(tenantLicenseRepository.findByValidUntilBeforeAndStatus(any(), eq(LicenseStatus.ACTIVE)))
                .thenReturn(List.of());
        when(tenantLicenseRepository.findByGracePeriodUntilBeforeAndStatus(any(), eq(LicenseStatus.GRACE_PERIOD)))
                .thenReturn(List.of());
        when(tenantLicenseRepository.findByStatus(eq(LicenseStatus.RESTRICTED_READ_ONLY)))
                .thenReturn(List.of());

        janitorJob.sweepLicenseLifecycle(now);

        verify(licenseNotificationService).dispatchLicenseReminder(
                eq(licExpiring7D), eq(com.company.ftthgis.domain.tenant.entity.LicenseNotificationStage.EXPIRING_7D), anyString()
        );
        verify(licenseNotificationService).dispatchLicenseReminder(
                eq(licExpiring3D), eq(com.company.ftthgis.domain.tenant.entity.LicenseNotificationStage.EXPIRING_3D), anyString()
        );
    }
}
