package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.domain.network.dto.OutageBlastResultDto;
import com.company.ftthgis.domain.network.entity.Customer;
import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.repository.CustomerRepository;
import com.company.ftthgis.domain.network.repository.ODCRepository;
import com.company.ftthgis.domain.network.repository.ODPRepository;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.service.TenantPackageSubscriptionService;
import com.company.ftthgis.service.WhatsAppGatewayClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WhatsAppOutageNotificationServiceTest {

    @Mock
    private WhatsAppGatewayClient whatsAppGatewayClient;

    @Mock
    private TenantPackageSubscriptionService subscriptionService;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private ODPRepository odpRepository;

    @Mock
    private ODCRepository odcRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @InjectMocks
    private WhatsAppOutageNotificationService outageService;

    private Organization organization;

    @BeforeEach
    void setUp() {
        organization = Organization.builder()
                .id(UUID.randomUUID())
                .name("Tenant Test")
                .slug("tenant-test-slug")
                .realmKey("tenant-realm")
                .build();
    }

    @Test
    @DisplayName("triggerOutageBlast skips and returns NO_ACTIVE_ENTITLEMENT if PKG_WA_OUTAGE is not active")
    void testTriggerOutageBlast_WithoutEntitlement() {
        when(subscriptionService.hasActiveFeature(organization.getId(), WhatsAppOutageNotificationService.OUTAGE_FEATURE_KEY))
                .thenReturn(false);

        Customer c1 = new Customer();
        c1.setName("Budi");
        c1.setPhone("081234567890");

        OutageBlastResultDto result = outageService.triggerOutageBlast(
                organization,
                "ODC-01",
                "ODC",
                List.of(c1),
                "FIBERCUT"
        );

        assertNotNull(result);
        assertEquals("SKIPPED", result.getStatus());
        assertEquals("NO_ACTIVE_ENTITLEMENT", result.getReason());
        assertEquals(WhatsAppOutageNotificationService.OUTAGE_PACKAGE_CODE, result.getRequiredPackage());
        assertEquals(0, result.getQueuedCount());
        assertEquals(1, result.getAffectedCustomersCount());

        verifyNoInteractions(whatsAppGatewayClient);
    }

    @Test
    @DisplayName("triggerOutageBlast skips if no customer phone numbers are registered")
    void testTriggerOutageBlast_NoPhoneNumbers() {
        when(subscriptionService.hasActiveFeature(organization.getId(), WhatsAppOutageNotificationService.OUTAGE_FEATURE_KEY))
                .thenReturn(true);

        Customer c1 = new Customer();
        c1.setName("Tanpa Nomor");
        c1.setPhone(null);

        OutageBlastResultDto result = outageService.triggerOutageBlast(
                organization,
                "ODC-01",
                "ODC",
                List.of(c1),
                "FIBERCUT"
        );

        assertNotNull(result);
        assertEquals("SKIPPED", result.getStatus());
        assertEquals("NO_VALID_PHONE_RECIPIENTS", result.getReason());
        assertEquals(0, result.getQueuedCount());

        verifyNoInteractions(whatsAppGatewayClient);
    }

    @Test
    @DisplayName("triggerOutageBlast dispatches formatted messages to gateway when entitlement is active")
    void testTriggerOutageBlast_Success() {
        when(subscriptionService.hasActiveFeature(organization.getId(), WhatsAppOutageNotificationService.OUTAGE_FEATURE_KEY))
                .thenReturn(true);

        Customer c1 = new Customer();
        c1.setName("Andi");
        c1.setPhone("081234567890");

        Customer c2 = new Customer();
        c2.setName("Siti");
        c2.setPhone("+628987654321");

        WhatsAppGatewayClient.BlastResponseData responseData =
                new WhatsAppGatewayClient.BlastResponseData("queued", 2);

        when(whatsAppGatewayClient.sendBlast(eq("tenant-test-slug"), anyList()))
                .thenReturn(Optional.of(responseData));

        OutageBlastResultDto result = outageService.triggerOutageBlast(
                organization,
                "ODC-01",
                "ODC",
                List.of(c1, c2),
                "Kabel Utama Putus Tertabrak Truk"
        );

        assertNotNull(result);
        assertEquals("QUEUED", result.getStatus());
        assertEquals("SUCCESS", result.getReason());
        assertEquals(2, result.getQueuedCount());
        assertEquals(2, result.getAffectedCustomersCount());

        ArgumentCaptor<List<WhatsAppGatewayClient.BlastMessageItem>> messagesCaptor =
                ArgumentCaptor.forClass(List.class);

        verify(whatsAppGatewayClient).sendBlast(eq("tenant-test-slug"), messagesCaptor.capture());
        List<WhatsAppGatewayClient.BlastMessageItem> captured = messagesCaptor.getValue();
        assertEquals(2, captured.size());

        // Verify phone E.164 formatting
        assertEquals("+6281234567890", captured.get(0).getPhone());
        assertTrue(captured.get(0).getMessage().contains("Andi"));
        assertTrue(captured.get(0).getMessage().contains("ODC-01"));
        assertTrue(captured.get(0).getMessage().contains("Kabel Utama Putus Tertabrak Truk"));

        assertEquals("+628987654321", captured.get(1).getPhone());
        assertTrue(captured.get(1).getMessage().contains("Siti"));
    }

    @Test
    @DisplayName("findDownstreamCustomers traverses ODC -> ODP -> Customers")
    void testFindDownstreamCustomers() {
        ODC odc = new ODC();
        odc.setCode("ODC-01");

        ODP odp1 = new ODP();
        odp1.setCode("ODP-01");

        ODP odp2 = new ODP();
        odp2.setCode("ODP-02");

        Customer cust1 = new Customer();
        cust1.setCode("CUST-01");
        Customer cust2 = new Customer();
        cust2.setCode("CUST-02");

        when(odcRepository.findByCode("ODC-01")).thenReturn(Optional.of(odc));
        when(odpRepository.findByOdc(odc)).thenReturn(List.of(odp1, odp2));
        when(customerRepository.findByOdp(odp1)).thenReturn(List.of(cust1));
        when(customerRepository.findByOdp(odp2)).thenReturn(List.of(cust2));

        List<Customer> downstream = outageService.findDownstreamCustomers("ODC-01", "ODC");

        assertEquals(2, downstream.size());
        assertTrue(downstream.contains(cust1));
        assertTrue(downstream.contains(cust2));
    }
}
