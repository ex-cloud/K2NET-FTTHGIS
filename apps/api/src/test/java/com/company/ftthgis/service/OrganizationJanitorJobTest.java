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
}
