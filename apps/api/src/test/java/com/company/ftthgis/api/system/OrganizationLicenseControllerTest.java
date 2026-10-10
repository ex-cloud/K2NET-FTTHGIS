package com.company.ftthgis.api.system;

import com.company.ftthgis.api.system.dto.LicenseExtendRequest;
import com.company.ftthgis.api.system.dto.LicenseOverviewKpiDto;
import com.company.ftthgis.api.system.dto.LicenseRevokeRequest;
import com.company.ftthgis.api.tenant.dto.LicenseEntitlementsDto;
import com.company.ftthgis.api.tenant.dto.LicenseIssueRequest;
import com.company.ftthgis.api.tenant.dto.LicenseResponseDto;
import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.service.LicenseManagementService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class OrganizationLicenseControllerTest {

    @Mock
    private LicenseManagementService licenseManagementService;

    @Mock
    private com.company.ftthgis.service.LicenseNotificationService licenseNotificationService;

    @Mock
    private com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository tenantLicenseRepository;

    @InjectMocks
    private OrganizationLicenseController organizationLicenseController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final UUID testOrgId = UUID.randomUUID();
    private final UUID testLicenseId = UUID.randomUUID();

    @BeforeEach
    public void setUp() {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
        mockMvc = MockMvcBuilders.standaloneSetup(organizationLicenseController).build();
    }

    @org.junit.jupiter.api.AfterEach
    public void tearDown() {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("GET /licenses/overview - Sukses mengambil ringkasan KPI lisensi seluruh platform")
    public void testGetLicensesOverview_Success() throws Exception {
        LicenseOverviewKpiDto overview = LicenseOverviewKpiDto.builder()
                .totalLicenses(42)
                .activeLicenses(38)
                .gracePeriodLicenses(2)
                .readOnlyLicenses(1)
                .suspendedLicenses(1)
                .expiringIn30Days(5)
                .tierDistribution(Map.of("PRO", 25L, "ENTERPRISE", 10L, "STARTER", 7L))
                .build();

        when(licenseManagementService.getLicensesOverview()).thenReturn(overview);

        mockMvc.perform(get("/api/v1/system/licenses/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalLicenses").value(42))
                .andExpect(jsonPath("$.activeLicenses").value(38))
                .andExpect(jsonPath("$.gracePeriodLicenses").value(2))
                .andExpect(jsonPath("$.expiringIn30Days").value(5))
                .andExpect(jsonPath("$.tierDistribution.PRO").value(25));

        verify(licenseManagementService, times(1)).getLicensesOverview();
    }

    @Test
    @DisplayName("GET /licenses - Sukses mengambil seluruh daftar lisensi platform")
    public void testGetAllLicenses_Success() throws Exception {
        LicenseResponseDto lic1 = LicenseResponseDto.builder()
                .id(testLicenseId)
                .organizationId(testOrgId)
                .organizationName("ISP Maju Bersama")
                .licenseKey("K2NET-ENT-11223344-AABB")
                .planName("ENTERPRISE")
                .status(LicenseStatus.ACTIVE)
                .build();

        when(licenseManagementService.getAllLicenses()).thenReturn(List.of(lic1));

        mockMvc.perform(get("/api/v1/system/licenses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].licenseKey").value("K2NET-ENT-11223344-AABB"))
                .andExpect(jsonPath("$[0].planName").value("ENTERPRISE"))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));

        verify(licenseManagementService, times(1)).getAllLicenses();
    }

    @Test
    @DisplayName("GET /organizations/{orgId}/licenses - Sukses mengambil riwayat lisensi satu organisasi")
    public void testGetLicensesByOrganization_Success() throws Exception {
        LicenseResponseDto lic = LicenseResponseDto.builder()
                .id(testLicenseId)
                .organizationId(testOrgId)
                .organizationName("ISP Maju Bersama")
                .licenseKey("K2NET-PRO-55667788-CCDD")
                .planName("PROFESSIONAL")
                .status(LicenseStatus.ACTIVE)
                .build();

        when(licenseManagementService.getLicensesByOrganization(testOrgId)).thenReturn(List.of(lic));

        mockMvc.perform(get("/api/v1/system/organizations/" + testOrgId + "/licenses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].licenseKey").value("K2NET-PRO-55667788-CCDD"))
                .andExpect(jsonPath("$[0].planName").value("PROFESSIONAL"));

        verify(licenseManagementService, times(1)).getLicensesByOrganization(testOrgId);
    }

    @Test
    @DisplayName("POST /organizations/{orgId}/licenses - Sukses menerbitkan lisensi kontrak B2B manual")
    public void testIssueManualLicense_Success() throws Exception {
        LicenseIssueRequest request = LicenseIssueRequest.builder()
                .organizationId(testOrgId)
                .planName("ENTERPRISE")
                .durationMonths(24)
                .activationType("ENTERPRISE_PO")
                .overrideMaxProjects(20)
                .overrideMaxOdps(10000)
                .overrideMaxCustomers(20000)
                .overrideMaxStorageGb(1000)
                .featureSsoEnabled(true)
                .notes("Kontrak 2 tahun B2B Telco")
                .build();

        TenantLicense issued = TenantLicense.builder()
                .id(testLicenseId)
                .licenseKey("K2NET-ENT-99887766-EEFF")
                .status(LicenseStatus.ACTIVE)
                .build();

        LicenseResponseDto dto = LicenseResponseDto.builder()
                .id(testLicenseId)
                .organizationId(testOrgId)
                .licenseKey("K2NET-ENT-99887766-EEFF")
                .planName("ENTERPRISE")
                .status(LicenseStatus.ACTIVE)
                .entitlements(LicenseEntitlementsDto.builder()
                        .maxProjects(20)
                        .maxOdps(10000)
                        .ssoEnabled(true)
                        .calculationSource("LICENSE_OVERRIDE")
                        .build())
                .build();

        when(licenseManagementService.issueManualLicenseWithOverrides(eq(testOrgId), any(LicenseIssueRequest.class), any()))
                .thenReturn(issued);
        when(licenseManagementService.getLicenseById(testLicenseId)).thenReturn(Optional.of(dto));

        mockMvc.perform(post("/api/v1/system/organizations/" + testOrgId + "/licenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.licenseKey").value("K2NET-ENT-99887766-EEFF"))
                .andExpect(jsonPath("$.planName").value("ENTERPRISE"))
                .andExpect(jsonPath("$.entitlements.maxProjects").value(20));

        verify(licenseManagementService, times(1))
                .issueManualLicenseWithOverrides(eq(testOrgId), any(LicenseIssueRequest.class), any());
    }

    @Test
    @DisplayName("POST /organizations/{orgId}/licenses/{licenseId}/extend - Sukses memperpanjang masa aktif")
    public void testExtendLicense_Success() throws Exception {
        LicenseExtendRequest request = LicenseExtendRequest.builder()
                .additionalMonths(6)
                .notes("Perpanjangan PO Kuartal 3")
                .build();

        TenantLicense extended = TenantLicense.builder()
                .id(testLicenseId)
                .licenseKey("K2NET-PRO-11223344-5566")
                .validUntil(LocalDateTime.now().plusMonths(6))
                .status(LicenseStatus.ACTIVE)
                .build();

        LicenseResponseDto dto = LicenseResponseDto.builder()
                .id(testLicenseId)
                .organizationId(testOrgId)
                .licenseKey("K2NET-PRO-11223344-5566")
                .daysRemaining(180L)
                .status(LicenseStatus.ACTIVE)
                .build();

        when(licenseManagementService.extendLicense(eq(testLicenseId), eq(6), any())).thenReturn(extended);
        when(licenseManagementService.getLicenseById(testLicenseId)).thenReturn(Optional.of(dto));

        mockMvc.perform(post("/api/v1/system/organizations/" + testOrgId + "/licenses/" + testLicenseId + "/extend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.licenseKey").value("K2NET-PRO-11223344-5566"))
                .andExpect(jsonPath("$.daysRemaining").value(180));

        verify(licenseManagementService, times(1)).extendLicense(eq(testLicenseId), eq(6), any());
    }

    @Test
    @DisplayName("POST /organizations/{orgId}/licenses/{licenseId}/extend - Ditolak jika bulan kurang dari 1 (400 Bad Request)")
    public void testExtendLicense_InvalidDuration() throws Exception {
        String invalidPayload = "{\"additionalMonths\":0}";

        mockMvc.perform(post("/api/v1/system/organizations/" + testOrgId + "/licenses/" + testLicenseId + "/extend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest());

        verify(licenseManagementService, never()).extendLicense(any(), anyInt(), any());
    }

    @Test
    @DisplayName("POST /organizations/{orgId}/licenses/{licenseId}/revoke - Sukses mencabut lisensi (Kill Switch)")
    public void testRevokeLicense_Success() throws Exception {
        LicenseRevokeRequest request = LicenseRevokeRequest.builder()
                .reason("Wanprestasi kontrak tagihan tertunggak > 90 hari")
                .build();

        mockMvc.perform(post("/api/v1/system/organizations/" + testOrgId + "/licenses/" + testLicenseId + "/revoke")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REVOKED"))
                .andExpect(jsonPath("$.licenseId").value(testLicenseId.toString()))
                .andExpect(jsonPath("$.organizationId").value(testOrgId.toString()))
                .andExpect(jsonPath("$.reason").value("Wanprestasi kontrak tagihan tertunggak > 90 hari"));

        verify(licenseManagementService, times(1))
                .revokeLicense(eq(testLicenseId), eq("Wanprestasi kontrak tagihan tertunggak > 90 hari"), any());
    }

    @Test
    @DisplayName("POST /organizations/{orgId}/licenses/{licenseId}/revoke - Ditolak jika alasan kosong (400 Bad Request)")
    public void testRevokeLicense_BlankReason() throws Exception {
        String invalidPayload = "{\"reason\":\"\"}";

        mockMvc.perform(post("/api/v1/system/organizations/" + testOrgId + "/licenses/" + testLicenseId + "/revoke")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest());

        verify(licenseManagementService, never()).revokeLicense(any(), any(), any());
    }

    @Test
    @DisplayName("GET /organizations/{orgId}/licenses/{licenseId}/export-cert - Sukses mengekspor berkas sertifikat offline (.lic)")
    public void testExportOfflineCertificate_Success() throws Exception {
        String fakeCert = "-----BEGIN K2NET LICENSE CERTIFICATE-----\nPayloadBase64==\n-----END K2NET LICENSE CERTIFICATE-----";
        when(licenseManagementService.exportOfflineCertificate(testLicenseId)).thenReturn(fakeCert);

        mockMvc.perform(get("/api/v1/system/organizations/" + testOrgId + "/licenses/" + testLicenseId + "/export-cert"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"k2net-license-" + testLicenseId.toString().substring(0, 8) + ".lic\""))
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_PLAIN))
                .andExpect(content().string(fakeCert));

        verify(licenseManagementService, times(1)).exportOfflineCertificate(testLicenseId);
    }

    @Test
    @DisplayName("GET /organizations/{orgId}/licenses/{licenseId}/notifications - Sukses mengambil riwayat log notifikasi")
    public void testGetNotificationLogs_Success() throws Exception {
        com.company.ftthgis.api.system.dto.LicenseNotificationLogDto logDto = com.company.ftthgis.api.system.dto.LicenseNotificationLogDto.builder()
                .id(UUID.randomUUID())
                .channel("EMAIL")
                .stage(com.company.ftthgis.domain.tenant.entity.LicenseNotificationStage.EXPIRING_7D)
                .recipient("billing@test.com")
                .status("SENT")
                .build();

        when(licenseNotificationService.getNotificationLogs(testOrgId, testLicenseId))
                .thenReturn(List.of(logDto));

        mockMvc.perform(get("/api/v1/system/organizations/" + testOrgId + "/licenses/" + testLicenseId + "/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].channel").value("EMAIL"))
                .andExpect(jsonPath("$[0].status").value("SENT"));

        verify(licenseNotificationService, times(1)).getNotificationLogs(testOrgId, testLicenseId);
    }

    @Test
    @DisplayName("POST /organizations/{orgId}/licenses/{licenseId}/send-reminder - Sukses trigger pengingat manual")
    public void testSendManualReminder_Success() throws Exception {
        TenantLicense license = TenantLicense.builder()
                .id(testLicenseId)
                .licenseKey("K2NET-PRO-ABCD1234-5678")
                .build();

        when(tenantLicenseRepository.findById(testLicenseId)).thenReturn(java.util.Optional.of(license));

        mockMvc.perform(post("/api/v1/system/organizations/" + testOrgId + "/licenses/" + testLicenseId + "/send-reminder"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.licenseId").value(testLicenseId.toString()));

        verify(licenseNotificationService, times(1)).dispatchLicenseReminder(
                eq(license), eq(com.company.ftthgis.domain.tenant.entity.LicenseNotificationStage.MANUAL_REMINDER), anyString()
        );
    }

    @Test
    @DisplayName("GET /organizations/{orgId}/licenses/prorate-estimate - Sukses kalkulasi upgrade prorata")
    public void testCalculateProrateEstimate_Success() throws Exception {
        com.company.ftthgis.api.tenant.dto.ProrateEstimateResponseDto estimate = com.company.ftthgis.api.tenant.dto.ProrateEstimateResponseDto.builder()
                .currentPlan("PRO")
                .targetPlan("ENTERPRISE")
                .currentPlanPrice(new java.math.BigDecimal("3900000"))
                .targetPlanPrice(new java.math.BigDecimal("9900000"))
                .daysRemaining(15)
                .totalCycleDays(30)
                .dailyRateOld(new java.math.BigDecimal("130000"))
                .proratedCredit(new java.math.BigDecimal("1950000"))
                .netDueAmount(new java.math.BigDecimal("7950000"))
                .currency("IDR")
                .isUpgradeEligible(true)
                .calculationSummary("Upgrade from PRO to ENTERPRISE with 15 days remaining credited.")
                .build();

        when(licenseManagementService.calculateProrateEstimate(testOrgId, "ENTERPRISE"))
                .thenReturn(estimate);

        mockMvc.perform(get("/api/v1/system/organizations/" + testOrgId + "/licenses/prorate-estimate")
                        .param("targetPlan", "ENTERPRISE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentPlan").value("PRO"))
                .andExpect(jsonPath("$.targetPlan").value("ENTERPRISE"))
                .andExpect(jsonPath("$.isUpgradeEligible").value(true))
                .andExpect(jsonPath("$.netDueAmount").value(7950000));

        verify(licenseManagementService, times(1)).calculateProrateEstimate(testOrgId, "ENTERPRISE");
    }
}

