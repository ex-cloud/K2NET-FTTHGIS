package com.company.ftthgis.service;

import com.company.ftthgis.api.tenant.dto.LicenseEntitlementsDto;
import com.company.ftthgis.api.tenant.dto.LicenseIssueRequest;
import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.domain.tenant.repository.BillingInvoiceRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.SubscriptionPlanRepository;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LicenseManagementServiceTest {

    @Mock
    private TenantLicenseRepository tenantLicenseRepository;

    @Mock
    private BillingInvoiceRepository billingInvoiceRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Mock
    private LicenseCryptoService licenseCryptoService;

    @Mock
    private AuditLoggingService auditLoggingService;

    @InjectMocks
    private LicenseManagementService licenseManagementService;

    private Organization testOrg;
    private SubscriptionPlan proPlan;

    @BeforeEach
    void setUp() {
        testOrg = Organization.builder()
                .id(UUID.randomUUID())
                .name("ISP Test West Java")
                .slug("isp-westjava")
                .status(Organization.OrganizationStatus.ACTIVE)
                .build();

        proPlan = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .name("PRO")
                .maxProjects(6)
                .maxOdps(2500)
                .maxOdcs(500)
                .maxCustomers(5000)
                .hasSso(true)
                .hasApiAccess(true)
                .build();

        testOrg.setSubscriptionPlan(proPlan);
    }

    @Test
    @DisplayName("issueOnlineLicense should create ACTIVE license with signed cryptographic key")
    void testIssueOnlineLicense() {
        when(licenseCryptoService.generateLicenseKey("PRO")).thenReturn("K2NET-PRO-11223344-AABB");
        when(licenseCryptoService.signLicenseMetadata(any(), any(), any(), any(), any(), any()))
                .thenReturn("mock-signature-digest");
        when(tenantLicenseRepository.save(any(TenantLicense.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        TenantLicense issued = licenseManagementService.issueOnlineLicense(testOrg, proPlan, 12, "SYSTEM_BILLING");

        assertNotNull(issued);
        assertEquals("K2NET-PRO-11223344-AABB", issued.getLicenseKey());
        assertEquals("mock-signature-digest", issued.getLicenseSignature());
        assertEquals(LicenseStatus.ACTIVE, issued.getStatus());
        assertEquals("ONLINE", issued.getActivationType());
        assertNotNull(issued.getValidUntil());
        verify(tenantLicenseRepository).save(any(TenantLicense.class));
        verify(auditLoggingService).logEvent(eq(testOrg.getSlug()), eq("LICENSE_ISSUED"), eq("ORGANIZATION"), anyString(), any(), any(), any());
    }

    @Test
    @DisplayName("issueManualLicenseWithOverrides should apply custom quota limits and restore ACTIVE status")
    void testIssueManualLicenseWithOverrides() {
        LicenseIssueRequest req = LicenseIssueRequest.builder()
                .organizationId(testOrg.getId())
                .planName("ENTERPRISE")
                .durationMonths(24)
                .overrideMaxProjects(25)
                .overrideMaxOdps(12000)
                .featureAiCopilotEnabled(true)
                .machineFingerprint("hw-enterprise-server-1")
                .build();

        SubscriptionPlan entPlan = SubscriptionPlan.builder().name("ENTERPRISE").build();

        when(organizationRepository.findById(testOrg.getId())).thenReturn(Optional.of(testOrg));
        when(subscriptionPlanRepository.findByName("ENTERPRISE")).thenReturn(Optional.of(entPlan));
        when(licenseCryptoService.generateLicenseKey("ENTERPRISE")).thenReturn("K2NET-ENT-88776655-CCDD");
        when(licenseCryptoService.signLicenseMetadata(any(), any(), any(), any(), any(), any()))
                .thenReturn("mock-sig-ent");
        when(tenantLicenseRepository.save(any(TenantLicense.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        TenantLicense manualLicense = licenseManagementService.issueManualLicenseWithOverrides(
                testOrg.getId(), req, "admin@k2net.id"
        );

        assertNotNull(manualLicense);
        assertEquals(25, manualLicense.getOverrideMaxProjects());
        assertEquals(12000, manualLicense.getOverrideMaxOdps());
        assertTrue(manualLicense.isFeatureAiCopilotEnabled());
        assertEquals("hw-enterprise-server-1", manualLicense.getMachineFingerprint());
    }

    @Test
    @DisplayName("activateLicenseKey should reject invalid checksum and accept valid keys")
    void testActivateLicenseKeyValidation() {
        String invalidKey = "INVALID-KEY-FORMAT";
        when(licenseCryptoService.verifyLicenseChecksum(invalidKey)).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () ->
                licenseManagementService.activateLicenseKey(testOrg.getId(), invalidKey, null, "user@isp.net")
        );

        String validKey = "K2NET-PRO-55443322-8899";
        when(licenseCryptoService.verifyLicenseChecksum(validKey)).thenReturn(true);
        when(organizationRepository.findById(testOrg.getId())).thenReturn(Optional.of(testOrg));
        when(tenantLicenseRepository.findByLicenseKey(validKey)).thenReturn(Optional.empty());
        when(subscriptionPlanRepository.findByName("PRO")).thenReturn(Optional.of(proPlan));
        when(licenseCryptoService.signLicenseMetadata(any(), any(), any(), any(), any(), any())).thenReturn("sig");
        when(tenantLicenseRepository.save(any(TenantLicense.class))).thenAnswer(inv -> inv.getArgument(0));

        TenantLicense activated = licenseManagementService.activateLicenseKey(
                testOrg.getId(), validKey, "hw-box", "tech@isp.net"
        );

        assertNotNull(activated);
        assertEquals(LicenseStatus.ACTIVE, activated.getStatus());
        assertEquals(Organization.OrganizationStatus.ACTIVE, testOrg.getStatus());
    }

    @Test
    @DisplayName("getEffectiveLicenseEntitlements should obey hierarchy priority: Override > Booster > Base Plan")
    void testGetEffectiveLicenseEntitlementsHierarchy() {
        // Scenario 1: License has overrides -> must return overrides
        TenantLicense overrideLicense = TenantLicense.builder()
                .status(LicenseStatus.ACTIVE)
                .overrideMaxProjects(20)
                .overrideMaxOdps(8000)
                .featureAiCopilotEnabled(true)
                .build();

        when(organizationRepository.findById(testOrg.getId())).thenReturn(Optional.of(testOrg));
        when(tenantLicenseRepository.findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(testOrg.getId(), LicenseStatus.ACTIVE))
                .thenReturn(Optional.of(overrideLicense));

        LicenseEntitlementsDto entitlements = licenseManagementService.getEffectiveLicenseEntitlements(testOrg.getId());

        assertEquals(20, entitlements.getMaxProjects());
        assertEquals(8000, entitlements.getMaxOdps());
        assertEquals("LICENSE_OVERRIDE", entitlements.getCalculationSource());
        assertTrue(entitlements.isAiCopilotEnabled());

        // Scenario 2: License has NO overrides, Org has active Booster
        testOrg.setBoosterOlts(4);
        testOrg.setBoosterOdps(1000);
        testOrg.setBoosterExpiresAt(LocalDateTime.now().plusDays(5));

        TenantLicense standardLicense = TenantLicense.builder()
                .status(LicenseStatus.ACTIVE)
                .build();

        when(tenantLicenseRepository.findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(testOrg.getId(), LicenseStatus.ACTIVE))
                .thenReturn(Optional.of(standardLicense));

        LicenseEntitlementsDto boosterEntitlements = licenseManagementService.getEffectiveLicenseEntitlements(testOrg.getId());

        assertEquals(10, boosterEntitlements.getMaxProjects(), "Base 6 + Booster 4 = 10");
        assertEquals(3500, boosterEntitlements.getMaxOdps(), "Base 2500 + Booster 1000 = 3500");
        assertEquals("EMERGENCY_BOOSTER", boosterEntitlements.getCalculationSource());
    }

    @Test
    @DisplayName("extendLicense should increment expiration timestamp and update digital signature")
    void testExtendLicense() {
        UUID licId = UUID.randomUUID();
        LocalDateTime validUntil = LocalDateTime.now().plusMonths(2);
        TenantLicense license = TenantLicense.builder()
                .id(licId)
                .organization(testOrg)
                .subscriptionPlan(proPlan)
                .licenseKey("K2NET-PRO-12345678-ABCD")
                .validFrom(LocalDateTime.now())
                .validUntil(validUntil)
                .status(LicenseStatus.GRACE_PERIOD)
                .build();

        when(tenantLicenseRepository.findById(licId)).thenReturn(Optional.of(license));
        when(licenseCryptoService.signLicenseMetadata(any(), any(), any(), any(), any(), any())).thenReturn("new-sig");
        when(tenantLicenseRepository.save(any(TenantLicense.class))).thenAnswer(inv -> inv.getArgument(0));

        TenantLicense extended = licenseManagementService.extendLicense(licId, 6, "admin");

        assertEquals(LicenseStatus.ACTIVE, extended.getStatus());
        assertNull(extended.getGracePeriodUntil());
        assertTrue(extended.getValidUntil().isAfter(validUntil.plusMonths(5)));
    }

    @Test
    @DisplayName("revokeLicense should transition status to REVOKED and append audit note")
    void testRevokeLicense() {
        UUID licId = UUID.randomUUID();
        TenantLicense license = TenantLicense.builder()
                .id(licId)
                .organization(testOrg)
                .licenseKey("K2NET-PRO-12345678-ABCD")
                .status(LicenseStatus.ACTIVE)
                .build();

        when(tenantLicenseRepository.findById(licId)).thenReturn(Optional.of(license));
        when(tenantLicenseRepository.save(any(TenantLicense.class))).thenAnswer(inv -> inv.getArgument(0));

        licenseManagementService.revokeLicense(licId, "Suspected contract breach", "super_admin");

        assertEquals(LicenseStatus.REVOKED, license.getStatus());
        assertTrue(license.getNotes().contains("Suspected contract breach"));
        verify(tenantLicenseRepository).save(license);
    }
}
