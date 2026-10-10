package com.company.ftthgis.service;

import com.company.ftthgis.api.system.dto.UpdateSubscriptionPlanRequest;
import com.company.ftthgis.api.system.dto.UpdateTenantLicenseRequest;
import com.company.ftthgis.api.tenant.dto.LicenseEntitlementsDto;
import com.company.ftthgis.api.tenant.dto.LicenseIssueRequest;
import com.company.ftthgis.api.tenant.dto.ProrateEstimateResponseDto;
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

import java.math.BigDecimal;
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

    @Test
    @DisplayName("activateLicenseKey should reject activation if hardware fingerprint does not match bound license")
    void testActivateLicenseKey_HardwareFingerprintMismatch_ThrowsException() {
        String key = "K2NET-PRO-11223344-AABB";
        when(licenseCryptoService.verifyLicenseChecksum(key)).thenReturn(true);
        when(organizationRepository.findById(testOrg.getId())).thenReturn(Optional.of(testOrg));

        TenantLicense boundLicense = TenantLicense.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .licenseKey(key)
                .machineFingerprint("6a09e667f3bcc908e3309a84")
                .validFrom(LocalDateTime.now().minusDays(1))
                .validUntil(LocalDateTime.now().plusMonths(6))
                .status(LicenseStatus.ACTIVE)
                .build();

        when(tenantLicenseRepository.findByLicenseKey(key)).thenReturn(Optional.of(boundLicense));
        when(licenseCryptoService.verifyMachineFingerprint("6a09e667f3bcc908e3309a84", "wrong-hardware-hash"))
                .thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                licenseManagementService.activateLicenseKey(testOrg.getId(), key, "wrong-hardware-hash", "admin")
        );

        assertTrue(ex.getMessage().contains("Hardware Fingerprint"));
    }

    @Test
    @DisplayName("activateLicenseKey should accept activation if hardware fingerprint matches bound license")
    void testActivateLicenseKey_HardwareFingerprintMatch_Success() {
        String key = "K2NET-PRO-11223344-AABB";
        when(licenseCryptoService.verifyLicenseChecksum(key)).thenReturn(true);
        when(organizationRepository.findById(testOrg.getId())).thenReturn(Optional.of(testOrg));

        TenantLicense boundLicense = TenantLicense.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .licenseKey(key)
                .machineFingerprint("6a09e667f3bcc908e3309a84")
                .validFrom(LocalDateTime.now().minusDays(1))
                .validUntil(LocalDateTime.now().plusMonths(6))
                .status(LicenseStatus.ACTIVE)
                .build();

        when(tenantLicenseRepository.findByLicenseKey(key)).thenReturn(Optional.of(boundLicense));
        when(licenseCryptoService.verifyMachineFingerprint("6a09e667f3bcc908e3309a84", "6a09e667f3bcc908e3309a84"))
                .thenReturn(true);
        when(tenantLicenseRepository.save(any(TenantLicense.class))).thenAnswer(inv -> inv.getArgument(0));

        TenantLicense activated = licenseManagementService.activateLicenseKey(
                testOrg.getId(), key, "6a09e667f3bcc908e3309a84", "admin"
        );

        assertNotNull(activated);
        assertEquals(LicenseStatus.ACTIVE, activated.getStatus());
        assertEquals("6a09e667f3bcc908e3309a84", activated.getMachineFingerprint());
    }

    @Test
    @DisplayName("activateOfflineCertificate should verify certificate and activate license with quota overrides")
    void testActivateOfflineCertificate_Success() {
        String certContent = "-----BEGIN K2NET LICENSE CERTIFICATE-----\nTEST_CERT\n-----END K2NET LICENSE CERTIFICATE-----";
        LicenseCryptoService.OfflineLicensePayload payload = LicenseCryptoService.OfflineLicensePayload.builder()
                .organizationId(testOrg.getId().toString())
                .organizationSlug(testOrg.getSlug())
                .organizationName(testOrg.getName())
                .licenseKey("K2NET-ENT-99887766-1122")
                .planName("ENTERPRISE")
                .validFrom(LocalDateTime.now().minusDays(1).toString())
                .validUntil(LocalDateTime.now().plusYears(1).toString())
                .machineFingerprint("c5e150fad4ff14d0")
                .maxProjects(30)
                .maxOdps(15000)
                .featureAiCopilotEnabled(true)
                .signature("valid-hmac-sig")
                .build();

        when(organizationRepository.findById(testOrg.getId())).thenReturn(Optional.of(testOrg));
        when(licenseCryptoService.parseAndVerifyOfflineCertificate(certContent)).thenReturn(payload);
        when(licenseCryptoService.verifyMachineFingerprint("c5e150fad4ff14d0", "c5e150fad4ff14d0")).thenReturn(true);
        when(tenantLicenseRepository.findByLicenseKey("K2NET-ENT-99887766-1122")).thenReturn(Optional.empty());
        when(subscriptionPlanRepository.findByName("ENTERPRISE")).thenReturn(Optional.of(proPlan));
        when(tenantLicenseRepository.save(any(TenantLicense.class))).thenAnswer(inv -> inv.getArgument(0));

        TenantLicense activated = licenseManagementService.activateOfflineCertificate(
                testOrg.getId(), certContent, "c5e150fad4ff14d0", "admin"
        );

        assertNotNull(activated);
        assertEquals(LicenseStatus.ACTIVE, activated.getStatus());
        assertEquals(30, activated.getOverrideMaxProjects());
        assertEquals(15000, activated.getOverrideMaxOdps());
        assertTrue(activated.isFeatureAiCopilotEnabled());
        assertEquals("c5e150fad4ff14d0", activated.getMachineFingerprint());
    }

    @Test
    @DisplayName("activateOfflineCertificate should reject certificate when hardware fingerprint mismatches")
    void testActivateOfflineCertificate_HardwareMismatch_ThrowsException() {
        String certContent = "-----BEGIN K2NET LICENSE CERTIFICATE-----\nTEST_CERT\n-----END K2NET LICENSE CERTIFICATE-----";
        LicenseCryptoService.OfflineLicensePayload payload = LicenseCryptoService.OfflineLicensePayload.builder()
                .organizationId(testOrg.getId().toString())
                .organizationSlug(testOrg.getSlug())
                .organizationName(testOrg.getName())
                .licenseKey("K2NET-ENT-99887766-1122")
                .planName("ENTERPRISE")
                .validFrom(LocalDateTime.now().minusDays(1).toString())
                .validUntil(LocalDateTime.now().plusYears(1).toString())
                .machineFingerprint("c5e150fad4ff14d0")
                .build();

        when(organizationRepository.findById(testOrg.getId())).thenReturn(Optional.of(testOrg));
        when(licenseCryptoService.parseAndVerifyOfflineCertificate(certContent)).thenReturn(payload);
        when(licenseCryptoService.verifyMachineFingerprint("c5e150fad4ff14d0", "spoofed-fingerprint")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                licenseManagementService.activateOfflineCertificate(testOrg.getId(), certContent, "spoofed-fingerprint", "admin")
        );

        assertTrue(ex.getMessage().contains("Hardware Fingerprint"));
    }

    @Test
    @DisplayName("calculateProrateEstimate should calculate 50% credit for Starter to Pro upgrade with 15 days remaining")
    void testCalculateProrateEstimate_StarterToPro_Day15() {
        SubscriptionPlan starterPlan = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .name("STARTER")
                .price(new BigDecimal("990000.00"))
                .maxProjects(2)
                .maxOdps(300)
                .build();

        SubscriptionPlan targetProPlan = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .name("PRO")
                .price(new BigDecimal("3900000.00"))
                .maxProjects(6)
                .maxOdps(2500)
                .build();

        LocalDateTime now = LocalDateTime.now();
        TenantLicense activeLicense = TenantLicense.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .subscriptionPlan(starterPlan)
                .licenseKey("K2NET-STARTER-11223344-AABB")
                .status(LicenseStatus.ACTIVE)
                .validFrom(now.minusDays(15))
                .validUntil(now.plusDays(15))
                .build();

        when(organizationRepository.findById(testOrg.getId())).thenReturn(Optional.of(testOrg));
        when(subscriptionPlanRepository.findByName("PRO")).thenReturn(Optional.of(targetProPlan));
        when(tenantLicenseRepository.findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(testOrg.getId(), LicenseStatus.ACTIVE))
                .thenReturn(Optional.of(activeLicense));

        ProrateEstimateResponseDto estimate = licenseManagementService.calculateProrateEstimate(testOrg.getId(), "PRO");

        assertNotNull(estimate);
        assertEquals("STARTER", estimate.getCurrentPlan());
        assertEquals("PRO", estimate.getTargetPlan());
        assertEquals(new BigDecimal("990000.00"), estimate.getCurrentPlanPrice());
        assertEquals(new BigDecimal("3900000.00"), estimate.getTargetPlanPrice());
        assertTrue(estimate.getDaysRemaining() >= 14 && estimate.getDaysRemaining() <= 15);
        assertTrue(estimate.isUpgradeEligible());
        // Daily rate: 990000 / 30 = 33000
        // Credit for 15 days: 33000 * 15 = 495000
        assertEquals(0, new BigDecimal("495000.00").compareTo(estimate.getProratedCredit()));
        assertEquals(0, new BigDecimal("3405000.00").compareTo(estimate.getNetDueAmount()));
    }

    @Test
    @DisplayName("calculateProrateEstimate should charge full price with 0 credit when no active license exists")
    void testCalculateProrateEstimate_NoActiveLicense_FullPrice() {
        SubscriptionPlan targetStarterPlan = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .name("STARTER")
                .price(new BigDecimal("990000.00"))
                .build();

        when(organizationRepository.findById(testOrg.getId())).thenReturn(Optional.of(testOrg));
        when(subscriptionPlanRepository.findByName("STARTER")).thenReturn(Optional.of(targetStarterPlan));
        when(tenantLicenseRepository.findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(testOrg.getId(), LicenseStatus.ACTIVE))
                .thenReturn(Optional.empty());

        ProrateEstimateResponseDto estimate = licenseManagementService.calculateProrateEstimate(testOrg.getId(), "STARTER");

        assertNotNull(estimate);
        assertEquals("STARTER", estimate.getTargetPlan());
        assertEquals(0, estimate.getDaysRemaining());
        assertEquals(0, BigDecimal.ZERO.compareTo(estimate.getProratedCredit()));
        assertEquals(0, new BigDecimal("990000.00").compareTo(estimate.getNetDueAmount()));
    }

    @Test
    @DisplayName("calculateProrateEstimate should give 0 credit for same plan or downgrade")
    void testCalculateProrateEstimate_SameOrDowngrade_ZeroCredit() {
        SubscriptionPlan proPlanCurrent = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .name("PRO")
                .price(new BigDecimal("3900000.00"))
                .build();

        SubscriptionPlan starterPlanTarget = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .name("STARTER")
                .price(new BigDecimal("990000.00"))
                .build();

        LocalDateTime now = LocalDateTime.now();
        TenantLicense activeLicense = TenantLicense.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .subscriptionPlan(proPlanCurrent)
                .licenseKey("K2NET-PRO-55667788-9900")
                .status(LicenseStatus.ACTIVE)
                .validFrom(now.minusDays(5))
                .validUntil(now.plusDays(25))
                .build();

        when(organizationRepository.findById(testOrg.getId())).thenReturn(Optional.of(testOrg));
        when(subscriptionPlanRepository.findByName("STARTER")).thenReturn(Optional.of(starterPlanTarget));
        when(tenantLicenseRepository.findFirstByOrganizationIdAndStatusOrderByCreatedAtDesc(testOrg.getId(), LicenseStatus.ACTIVE))
                .thenReturn(Optional.of(activeLicense));

        ProrateEstimateResponseDto estimate = licenseManagementService.calculateProrateEstimate(testOrg.getId(), "STARTER");

        assertNotNull(estimate);
        assertFalse(estimate.isUpgradeEligible());
        assertEquals(0, BigDecimal.ZERO.compareTo(estimate.getProratedCredit()));
        assertEquals(0, new BigDecimal("990000.00").compareTo(estimate.getNetDueAmount()));
    }

    @Test
    @DisplayName("getAllSubscriptionPlans should return all plans from repository")
    void testGetAllSubscriptionPlans() {
        when(subscriptionPlanRepository.findAll()).thenReturn(java.util.List.of(proPlan));

        java.util.List<SubscriptionPlan> plans = licenseManagementService.getAllSubscriptionPlans();

        assertEquals(1, plans.size());
        assertEquals("PRO", plans.get(0).getName());
        verify(subscriptionPlanRepository).findAll();
    }

    @Test
    @DisplayName("updateSubscriptionPlan should update plan pricing and quotas")
    void testUpdateSubscriptionPlan() {
        UUID planId = proPlan.getId();
        when(subscriptionPlanRepository.findById(planId)).thenReturn(Optional.of(proPlan));
        when(subscriptionPlanRepository.save(any(SubscriptionPlan.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateSubscriptionPlanRequest req = UpdateSubscriptionPlanRequest.builder()
                .description("Updated PRO description")
                .price(new BigDecimal("4500000.00"))
                .maxProjects(8)
                .maxOdps(3000)
                .maxCustomers(6000)
                .hasSso(true)
                .hasApiAccess(true)
                .build();

        SubscriptionPlan updated = licenseManagementService.updateSubscriptionPlan(planId, req, "SUPER_ADMIN");

        assertNotNull(updated);
        assertEquals(new BigDecimal("4500000.00"), updated.getPrice());
        assertEquals(8, updated.getMaxProjects());
        assertEquals(3000, updated.getMaxOdps());
        assertEquals("Updated PRO description", updated.getDescription());
        verify(subscriptionPlanRepository).save(proPlan);
    }

    @Test
    @DisplayName("updateTenantLicense should update quota overrides, contacts and re-sign metadata")
    void testUpdateTenantLicense() {
        UUID licenseId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        TenantLicense existing = TenantLicense.builder()
                .id(licenseId)
                .organization(testOrg)
                .subscriptionPlan(proPlan)
                .licenseKey("K2NET-PRO-1122-3344")
                .licenseSignature("old-signature")
                .status(LicenseStatus.ACTIVE)
                .validFrom(now.minusDays(10))
                .validUntil(now.plusDays(20))
                .build();

        when(tenantLicenseRepository.findById(licenseId)).thenReturn(Optional.of(existing));
        when(licenseCryptoService.signLicenseMetadata(any(), any(), any(), any(), any(), any()))
                .thenReturn("new-re-signed-digest");
        when(tenantLicenseRepository.save(any(TenantLicense.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateTenantLicenseRequest req = UpdateTenantLicenseRequest.builder()
                .validUntil(now.plusDays(90))
                .overrideMaxProjects(12)
                .overrideMaxOdps(5000)
                .featureAiCopilotEnabled(true)
                .machineFingerprint("NEW-HW-FINGERPRINT-ABC")
                .billingContactName("John Finance")
                .billingContactEmail("finance@westjava.net")
                .billingContactPhone("+628123456789")
                .build();

        TenantLicense updated = licenseManagementService.updateTenantLicense(licenseId, req, "SUPER_ADMIN");

        assertNotNull(updated);
        assertEquals(12, updated.getOverrideMaxProjects());
        assertEquals(5000, updated.getOverrideMaxOdps());
        assertTrue(updated.isFeatureAiCopilotEnabled());
        assertEquals("NEW-HW-FINGERPRINT-ABC", updated.getMachineFingerprint());
        assertEquals("new-re-signed-digest", updated.getLicenseSignature());
        assertEquals("John Finance", updated.getBillingContactName());
        assertEquals("finance@westjava.net", updated.getBillingContactEmail());
        verify(tenantLicenseRepository).save(existing);
        verify(licenseCryptoService).signLicenseMetadata(any(), any(), any(), any(), any(), eq("NEW-HW-FINGERPRINT-ABC"));
    }
}
