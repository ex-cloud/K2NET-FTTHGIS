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

    @Mock
    private com.company.ftthgis.domain.network.repository.NetworkNodeRepository networkNodeRepository;

    @Mock
    private com.company.ftthgis.domain.tenant.repository.TenantPackageSubscriptionRepository tenantPackageSubscriptionRepository;

    @Mock
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Mock
    private jakarta.persistence.EntityManager entityManager;

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

    @Test
    void testAssertCanCreateOltSuccessWhenBelowLimit() {
        when(organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(any(), eq("max_olts")))
                .thenReturn(Optional.empty());
        when(organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(any(), eq("max_projects")))
                .thenReturn(Optional.empty());
        when(networkNodeRepository.countByOrganizationIdAndNodeType(orgId, "OLT"))
                .thenReturn(2L);

        // Max projects/olts is 6 from PRO plan, current used is 2
        assertDoesNotThrow(() -> projectQuotaService.assertCanCreateOlt(org));
    }

    @Test
    void testAssertCanCreateOltThrowsQuotaExceededExceptionWhenLimitReached() {
        when(organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(any(), eq("max_olts")))
                .thenReturn(Optional.empty());
        when(organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(any(), eq("max_projects")))
                .thenReturn(Optional.empty());
        when(networkNodeRepository.countByOrganizationIdAndNodeType(orgId, "OLT"))
                .thenReturn(6L);

        QuotaExceededException ex = assertThrows(QuotaExceededException.class,
                () -> projectQuotaService.assertCanCreateOlt(org));

        assertEquals("OLT_QUOTA_EXCEEDED", ex.getErrorCode());
        assertEquals(6, ex.getCurrent());
        assertEquals(6, ex.getMax());
    }

    @Test
    void testEffectiveMaxOltsWithLicenseOverride() {
        TenantLicense license = TenantLicense.builder()
                .status(LicenseStatus.ACTIVE)
                .overrideMaxProjects(10)
                .build();

        when(tenantLicenseRepository.findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(orgId, LicenseStatus.ACTIVE))
                .thenReturn(Optional.of(license));

        int effectiveMax = projectQuotaService.getEffectiveMaxOlts(org);
        assertEquals(10, effectiveMax);
    }

    @Test
    void testAssertCanAllocateOdpsSuccessWhenBelowLimit() {
        when(organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(any(), eq("max_odps")))
                .thenReturn(Optional.empty());
        when(networkNodeRepository.countBillableOdpsByOrganizationId(orgId))
                .thenReturn(1000L);

        // Limit is 2500 from PRO plan, allocate 500 -> 1500 <= 2500
        assertDoesNotThrow(() -> projectQuotaService.assertCanAllocateOdps(org, 500));
    }

    @Test
    void testAssertCanAllocateOdpsThrowsQuotaExceededExceptionWhenLimitReached() {
        when(organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(any(), eq("max_odps")))
                .thenReturn(Optional.empty());
        when(networkNodeRepository.countBillableOdpsByOrganizationId(orgId))
                .thenReturn(2490L);

        // 2490 + 20 = 2510 > 2500
        QuotaExceededException ex = assertThrows(QuotaExceededException.class,
                () -> projectQuotaService.assertCanAllocateOdps(org, 20));

        assertEquals("ODP_QUOTA_EXCEEDED", ex.getErrorCode());
        assertEquals(2510, ex.getCurrent());
        assertEquals(2500, ex.getMax());
    }

    @Test
    void testEffectiveMaxStorageGbWithBasePlanAndLicenseOverride() {
        // PRO default is 100 GB
        when(organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(any(), eq("max_storage_gb")))
                .thenReturn(Optional.empty());
        int defaultProStorage = projectQuotaService.getEffectiveMaxStorageGb(org);
        assertEquals(100, defaultProStorage);

        // License override to 250 GB
        TenantLicense license = TenantLicense.builder()
                .status(LicenseStatus.ACTIVE)
                .overrideMaxStorageGb(250)
                .build();
        when(tenantLicenseRepository.findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(orgId, LicenseStatus.ACTIVE))
                .thenReturn(Optional.of(license));

        int overriddenStorage = projectQuotaService.getEffectiveMaxStorageGb(org);
        assertEquals(250, overriddenStorage);
    }

    @Test
    void testAssertCanUploadBytesSuccessWhenBelowLimit() {
        when(organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(any(), eq("max_storage_gb")))
                .thenReturn(Optional.empty());
        // PRO max is 100 GB. Current used: 10 GB. Uploading 50 MB.
        long currentUsedBytes = 10L * 1024L * 1024L * 1024L;
        long uploadBytes = 50L * 1024L * 1024L;

        assertDoesNotThrow(() -> projectQuotaService.assertCanUploadBytes(org, uploadBytes, currentUsedBytes));
    }

    @Test
    void testAssertCanUploadBytesThrowsQuotaExceededExceptionWhenLimitReached() {
        when(organizationConfigRepository.findByOrganizationAndConfigKeyIgnoreCase(any(), eq("max_storage_gb")))
                .thenReturn(Optional.empty());
        // PRO max is 100 GB (~102400 MB). Current used: 99.9 GB. Uploading 200 MB.
        long maxBytes = 100L * 1024L * 1024L * 1024L;
        long currentUsedBytes = maxBytes - (50L * 1024L * 1024L); // 50MB free
        long uploadBytes = 200L * 1024L * 1024L; // exceeds free space

        QuotaExceededException ex = assertThrows(QuotaExceededException.class,
                () -> projectQuotaService.assertCanUploadBytes(org, uploadBytes, currentUsedBytes));

        assertEquals("STORAGE_QUOTA_EXCEEDED", ex.getErrorCode());
    }
}

