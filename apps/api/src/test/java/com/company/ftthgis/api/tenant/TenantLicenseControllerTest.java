package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.tenant.dto.LicenseEntitlementsDto;
import com.company.ftthgis.api.tenant.dto.LicenseResponseDto;
import com.company.ftthgis.config.tenant.OrganizationContext;
import com.company.ftthgis.domain.tenant.entity.BillingInvoice;
import com.company.ftthgis.domain.tenant.entity.InvoiceStatus;
import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.domain.tenant.repository.BillingInvoiceRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.LicenseManagementService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class TenantLicenseControllerTest {

    @Mock
    private LicenseManagementService licenseManagementService;

    @Mock
    private BillingInvoiceRepository billingInvoiceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.company.ftthgis.service.LicenseNotificationService licenseNotificationService;

    @InjectMocks
    private TenantLicenseController tenantLicenseController;

    private MockMvc mockMvc;
    private final UUID testOrgId = UUID.randomUUID();

    @BeforeEach
    public void setUp() {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
        mockMvc = MockMvcBuilders.standaloneSetup(tenantLicenseController).build();
        OrganizationContext.setOrganizationId(testOrgId);
    }

    @AfterEach
    public void tearDown() {
        OrganizationContext.clear();
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("GET /current - Sukses mengambil lisensi aktif organisasi")
    public void testGetCurrentLicense_Success() throws Exception {
        LicenseResponseDto dto = LicenseResponseDto.builder()
                .id(UUID.randomUUID())
                .organizationId(testOrgId)
                .organizationName("ISP Nusantara")
                .licenseKey("K2NET-PRO-9F4D2A1C-7B8E")
                .maskedLicenseKey("K2NET-PRO-****-7B8E")
                .planName("PROFESSIONAL")
                .status(LicenseStatus.ACTIVE)
                .validFrom(LocalDateTime.now().minusDays(10))
                .validUntil(LocalDateTime.now().plusDays(20))
                .daysRemaining(20L)
                .entitlements(LicenseEntitlementsDto.builder()
                        .maxProjects(5)
                        .maxOdps(500)
                        .maxOdcs(50)
                        .maxCustomers(2500)
                        .maxStorageGb(100)
                        .ssoEnabled(true)
                        .apiEnabled(true)
                        .aiCopilotEnabled(false)
                        .build())
                .build();

        when(licenseManagementService.getCurrentLicense(testOrgId)).thenReturn(Optional.of(dto));

        mockMvc.perform(get("/api/v1/tenant/license/current"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.licenseKey").value("K2NET-PRO-9F4D2A1C-7B8E"))
                .andExpect(jsonPath("$.planName").value("PROFESSIONAL"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.entitlements.maxProjects").value(5))
                .andExpect(jsonPath("$.entitlements.maxOdps").value(500))
                .andExpect(jsonPath("$.entitlements.ssoEnabled").value(true));

        verify(licenseManagementService, times(1)).getCurrentLicense(testOrgId);
    }

    @Test
    @DisplayName("GET /current - Lisensi tidak ditemukan (404 Not Found)")
    public void testGetCurrentLicense_NotFound() throws Exception {
        when(licenseManagementService.getCurrentLicense(testOrgId)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/tenant/license/current"))
                .andExpect(status().isNotFound());

        verify(licenseManagementService, times(1)).getCurrentLicense(testOrgId);
    }

    @Test
    @DisplayName("GET /current - Tanpa konteks organisasi tenant (400 Bad Request)")
    public void testGetCurrentLicense_NoOrgContext() throws Exception {
        OrganizationContext.clear();

        mockMvc.perform(get("/api/v1/tenant/license/current"))
                .andExpect(status().isBadRequest());

        verify(licenseManagementService, never()).getCurrentLicense(any());
    }

    @Test
    @DisplayName("POST /activate - Sukses mengaktivasi kunci lisensi mandiri")
    public void testActivateLicense_Success() throws Exception {
        String validKey = "K2NET-PRO-9F4D2A1C-7B8E";
        String payload = "{\"licenseKey\":\"" + validKey + "\",\"machineFingerprint\":\"hw-srv-01\"}";

        SubscriptionPlan plan = SubscriptionPlan.builder()
                .name("PROFESSIONAL")
                .build();

        TenantLicense activatedLicense = TenantLicense.builder()
                .id(UUID.randomUUID())
                .licenseKey(validKey)
                .subscriptionPlan(plan)
                .status(LicenseStatus.ACTIVE)
                .build();

        LicenseResponseDto dto = LicenseResponseDto.builder()
                .id(activatedLicense.getId())
                .organizationId(testOrgId)
                .licenseKey(validKey)
                .planName("PROFESSIONAL")
                .status(LicenseStatus.ACTIVE)
                .build();

        when(licenseManagementService.activateLicenseKey(eq(testOrgId), eq(validKey), eq("hw-srv-01"), any()))
                .thenReturn(activatedLicense);
        when(licenseManagementService.getCurrentLicense(testOrgId)).thenReturn(Optional.of(dto));

        mockMvc.perform(post("/api/v1/tenant/license/activate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.licenseKey").value(validKey))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.planName").value("PROFESSIONAL"));

        verify(licenseManagementService, times(1))
                .activateLicenseKey(eq(testOrgId), eq(validKey), eq("hw-srv-01"), any());
    }

    @Test
    @DisplayName("POST /activate - Format kunci lisensi tidak valid ditolak oleh validator (400 Bad Request)")
    public void testActivateLicense_InvalidKeyFormat() throws Exception {
        String invalidPayload = "{\"licenseKey\":\"INVALID-KEY-123\"}";

        mockMvc.perform(post("/api/v1/tenant/license/activate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest());

        verify(licenseManagementService, never()).activateLicenseKey(any(), any(), any(), any());
    }

    @Test
    @DisplayName("POST /activate - Kunci lisensi kosong ditolak (400 Bad Request)")
    public void testActivateLicense_BlankKey() throws Exception {
        String invalidPayload = "{\"licenseKey\":\"\"}";

        mockMvc.perform(post("/api/v1/tenant/license/activate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest());

        verify(licenseManagementService, never()).activateLicenseKey(any(), any(), any(), any());
    }

    @Test
    @DisplayName("GET /invoices - Sukses mengambil daftar faktur penagihan tenant")
    public void testGetBillingInvoices_Success() throws Exception {
        Organization org = Organization.builder()
                .id(testOrgId)
                .name("ISP Nusantara")
                .build();

        BillingInvoice inv1 = BillingInvoice.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .invoiceNumber("INV-202610-001")
                .description("Langganan Paket PROFESSIONAL Bulanan")
                .amount(new BigDecimal("2500000.00"))
                .currency("IDR")
                .status(InvoiceStatus.PAID)
                .dueDate(LocalDateTime.now().minusDays(5))
                .paidAt(LocalDateTime.now().minusDays(5))
                .paymentMethod("XENDIT_VA")
                .paymentChannel("BCA")
                .externalReferenceId("xendit-inv-99")
                .createdAt(LocalDateTime.now().minusDays(10))
                .build();

        when(billingInvoiceRepository.findByOrganizationIdOrderByDueDateDesc(testOrgId))
                .thenReturn(List.of(inv1));

        mockMvc.perform(get("/api/v1/tenant/license/invoices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].invoiceNumber").value("INV-202610-001"))
                .andExpect(jsonPath("$[0].amount").value(2500000.00))
                .andExpect(jsonPath("$[0].status").value("PAID"))
                .andExpect(jsonPath("$[0].paymentChannel").value("BCA"));

        verify(billingInvoiceRepository, times(1)).findByOrganizationIdOrderByDueDateDesc(testOrgId);
    }

    @Test
    @DisplayName("GET /api/v1/tenant/license/contacts - Sukses mengambil kontak penagihan")
    public void testGetBillingContacts_Success() throws Exception {
        com.company.ftthgis.api.tenant.dto.BillingContactsDto dto = com.company.ftthgis.api.tenant.dto.BillingContactsDto.builder()
                .billingContactName("John Doe")
                .billingContactEmail("john@isp.net")
                .billingContactPhone("+628123456789")
                .notifyEmailEnabled(true)
                .notifyWhatsappEnabled(true)
                .build();

        when(licenseNotificationService.getBillingContacts(testOrgId)).thenReturn(dto);

        mockMvc.perform(get("/api/v1/tenant/license/contacts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.billingContactName").value("John Doe"))
                .andExpect(jsonPath("$.billingContactEmail").value("john@isp.net"))
                .andExpect(jsonPath("$.billingContactPhone").value("+628123456789"));

        verify(licenseNotificationService, times(1)).getBillingContacts(testOrgId);
    }

    @Test
    @DisplayName("PUT /api/v1/tenant/license/contacts - Sukses memperbarui kontak penagihan")
    public void testUpdateBillingContacts_Success() throws Exception {
        com.company.ftthgis.api.tenant.dto.BillingContactsDto dto = com.company.ftthgis.api.tenant.dto.BillingContactsDto.builder()
                .billingContactName("Jane Doe")
                .billingContactEmail("jane@isp.net")
                .billingContactPhone("+628987654321")
                .notifyEmailEnabled(true)
                .notifyWhatsappEnabled(false)
                .build();

        when(licenseNotificationService.updateBillingContacts(eq(testOrgId), any())).thenReturn(dto);

        String jsonPayload = """
            {
                "billingContactName": "Jane Doe",
                "billingContactEmail": "jane@isp.net",
                "billingContactPhone": "+628987654321",
                "notifyEmailEnabled": true,
                "notifyWhatsappEnabled": false
            }
            """;

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/tenant/license/contacts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.billingContactName").value("Jane Doe"))
                .andExpect(jsonPath("$.billingContactEmail").value("jane@isp.net"))
                .andExpect(jsonPath("$.notifyWhatsappEnabled").value(false));

        verify(licenseNotificationService, times(1)).updateBillingContacts(eq(testOrgId), any());
    }
}
