package com.company.ftthgis.service;

import com.company.ftthgis.api.exception.QuotaExceededException;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationConfig;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.repository.OrganizationConfigRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;

@ExtendWith(MockitoExtension.class)
class ProjectQuotaServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private OrganizationConfigRepository organizationConfigRepository;

    @Mock
    private TenantLicenseRepository tenantLicenseRepository;

    @InjectMocks
    private ProjectQuotaService projectQuotaService;

    private Organization org;
    private SubscriptionPlan plan;
    private UUID orgId;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        plan = SubscriptionPlan.builder()
                .name("PRO")
                .maxProjects(6)
                .maxArchivedProjects(6)
                .build();

        org = Organization.builder()
                .id(orgId)
                .name("PT Sukses Network")
                .slug("sukses-net")
                .subscriptionPlan(plan)
                .status(Organization.OrganizationStatus.ACTIVE)
                .build();
    }

    @Test
    void testAssertCanActivateSuccessWhenBelowQuota() {
        when(organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(any(), eq("max_projects")))
                .thenReturn(Optional.empty());
        when(organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(any(), eq("max_olts")))
                .thenReturn(Optional.empty());
        when(projectRepository.countByOrganizationIdAndStatus(orgId, Project.ProjectStatus.ACTIVE))
                .thenReturn(3L);

        assertDoesNotThrow(() -> projectQuotaService.assertCanActivate(org));
    }

    @Test
    void testAssertCanActivateThrowsQuotaExceededExceptionWhenLimitReached() {
        when(organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(any(), eq("max_projects")))
                .thenReturn(Optional.empty());
        when(organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(any(), eq("max_olts")))
                .thenReturn(Optional.empty());
        when(projectRepository.countByOrganizationIdAndStatus(orgId, Project.ProjectStatus.ACTIVE))
                .thenReturn(6L);

        QuotaExceededException ex = assertThrows(QuotaExceededException.class,
                () -> projectQuotaService.assertCanActivate(org));

        assertEquals("PROJECT_QUOTA_EXCEEDED", ex.getErrorCode());
        assertEquals(6, ex.getCurrent());
        assertEquals(6, ex.getMax());
    }

    @Test
    void testAssertCanArchiveSuccessWhenBelowLimit() {
        when(organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(any(), eq("max_archived_projects")))
                .thenReturn(Optional.empty());
        when(projectRepository.countByOrganizationIdAndStatus(orgId, Project.ProjectStatus.ARCHIVED))
                .thenReturn(2L);

        assertDoesNotThrow(() -> projectQuotaService.assertCanArchive(org));
    }

    @Test
    void testAssertCanArchiveThrowsQuotaExceededExceptionWhenArchiveLimitReached() {
        when(organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(any(), eq("max_archived_projects")))
                .thenReturn(Optional.empty());
        when(projectRepository.countByOrganizationIdAndStatus(orgId, Project.ProjectStatus.ARCHIVED))
                .thenReturn(6L);

        QuotaExceededException ex = assertThrows(QuotaExceededException.class,
                () -> projectQuotaService.assertCanArchive(org));

        assertEquals("ARCHIVE_QUOTA_EXCEEDED", ex.getErrorCode());
        assertEquals(6, ex.getCurrent());
        assertEquals(6, ex.getMax());
    }

    @Test
    void testConfigOverrideTakesPrecedenceOverBasePlan() {
        OrganizationConfig overrideConfig = OrganizationConfig.builder()
                .configKey("max_projects")
                .configValue("10")
                .build();

        when(organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(any(), eq("max_projects")))
                .thenReturn(Optional.of(overrideConfig));

        int effectiveMax = projectQuotaService.getEffectiveMaxProjects(org);
        assertEquals(10, effectiveMax);
    }

    @Test
    void testBoosterIncreasesActiveLimit() {
        org.setBoosterOlts(4);
        org.setBoosterExpiresAt(LocalDateTime.now().plusDays(5));

        when(organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(any(), eq("max_projects")))
                .thenReturn(Optional.empty());
        when(organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(any(), eq("max_olts")))
                .thenReturn(Optional.empty());

        int effectiveMax = projectQuotaService.getEffectiveMaxProjects(org);
        assertEquals(10, effectiveMax); // 6 base + 4 booster
    }

    @Test
    void testLicenseOverrideTakesPrecedenceOverPlanAndBooster() {
        TenantLicense license = TenantLicense.builder()
                .status(LicenseStatus.ACTIVE)
                .overrideMaxProjects(25)
                .build();

        when(tenantLicenseRepository.findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(orgId, LicenseStatus.ACTIVE))
                .thenReturn(Optional.of(license));

        int effectiveMax = projectQuotaService.getEffectiveMaxProjects(org);
        assertEquals(25, effectiveMax); // Prioritas tertinggi: 25 dari lisensi
    }

    @Test
    void testLicenseOdpOverrideTakesPrecedenceOverPlan() {
        TenantLicense license = TenantLicense.builder()
                .status(LicenseStatus.ACTIVE)
                .overrideMaxOdps(15000)
                .build();

        when(tenantLicenseRepository.findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(orgId, LicenseStatus.ACTIVE))
                .thenReturn(Optional.of(license));

        int effectiveMax = projectQuotaService.getEffectiveMaxOdps(org);
        assertEquals(15000, effectiveMax); // Prioritas tertinggi: 15000 dari lisensi
    }
}
