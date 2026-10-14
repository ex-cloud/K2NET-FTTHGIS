package com.company.ftthgis.service.tenantapi;

import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.config.security.SSRFSafeHttpClient;
import com.company.ftthgis.config.security.WebhookSecurityValidator;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantWebhook;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookDelivery;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSlugAliasRepository;
import com.company.ftthgis.domain.tenant.repository.TenantWebhookDeliveryRepository;
import com.company.ftthgis.domain.tenant.repository.TenantWebhookRepository;
import com.company.ftthgis.util.SecretEncryptionUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TenantWebhookServiceTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationSlugAliasRepository slugAliasRepository;

    @Mock
    private TenantWebhookRepository webhookRepository;

    @Mock
    private TenantWebhookDeliveryRepository deliveryRepository;

    @Mock
    private WebhookSecurityValidator securityValidator;

    @Mock
    private SSRFSafeHttpClient httpClient;

    @Mock
    private SecretEncryptionUtil encryptionUtil;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private TenantWebhookService webhookService;

    private Organization organization;
    private UUID orgId;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        organization = Organization.builder()
                .id(orgId)
                .name("PT Cicadas Fiber")
                .slug("cicadas")
                .build();

        when(organizationRepository.findBySlug("cicadas")).thenReturn(Optional.of(organization));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
        when(encryptionUtil.generateSecureToken(anyInt())).thenReturn("mockedsecret1234567890abcdef");
        when(encryptionUtil.computeHmacSha256(anyString(), anyString())).thenReturn("mockedsignature");
    }

    @Test
    @DisplayName("Should list webhooks for organization")
    void testListWebhooks() {
        TenantWebhook webhook = TenantWebhook.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .name("NOC Alert Webhook")
                .url("https://noc.example.com/webhook")
                .signingSecret("whsec_123")
                .events("network.outage,network.olt.status")
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(webhookRepository.findByOrganizationIdNative(orgId)).thenReturn(List.of(webhook));

        List<WebhookResponseDto> result = webhookService.listWebhooks("cicadas");

        assertEquals(1, result.size());
        assertEquals("NOC Alert Webhook", result.get(0).getName());
        assertEquals("https://noc.example.com/webhook", result.get(0).getUrl());
        assertEquals(2, result.get(0).getEvents().size());
        assertTrue(result.get(0).isActive());
    }

    @Test
    @DisplayName("Should create webhook successfully with generated secret")
    void testCreateWebhook_Success() {
        CreateWebhookRequest request = CreateWebhookRequest.builder()
                .name("Billing Webhook")
                .url("https://billing.example.com/events")
                .events(List.of("customer.created", "invoice.paid"))
                .build();

        when(webhookRepository.save(any(TenantWebhook.class))).thenAnswer(invocation -> {
            TenantWebhook w = invocation.getArgument(0);
            w.setId(UUID.randomUUID());
            w.setCreatedAt(LocalDateTime.now());
            return w;
        });

        WebhookResponseDto result = webhookService.createWebhook("cicadas", request);

        assertNotNull(result);
        assertEquals("Billing Webhook", result.getName());
        assertEquals("https://billing.example.com/events", result.getUrl());
        assertTrue(result.getSigningSecret().startsWith("whsec_"));
        verify(securityValidator).validateUrl("https://billing.example.com/events");
        verify(webhookRepository).save(any(TenantWebhook.class));
    }

    @Test
    @DisplayName("Should roll webhook signing secret successfully")
    void testRollSecret() {
        UUID webhookId = UUID.randomUUID();
        TenantWebhook webhook = TenantWebhook.builder()
                .id(webhookId)
                .organization(organization)
                .signingSecret("old_secret")
                .build();

        when(webhookRepository.findByIdAndOrganizationIdNative(orgId, webhookId)).thenReturn(Optional.of(webhook));

        RollSecretResponse response = webhookService.rollSecret("cicadas", webhookId);

        assertNotNull(response);
        assertTrue(response.getPlainTextSecret().startsWith("whsec_"));
        assertTrue(response.getWebhookSecretMasked().startsWith("whsec_••••••••"));
        verify(webhookRepository).save(webhook);
    }

    @Test
    @DisplayName("Should test ping webhook with HMAC-SHA256 signature and record delivery receipt")
    void testPingWebhook_Success() throws Exception {
        UUID webhookId = UUID.randomUUID();
        TenantWebhook webhook = TenantWebhook.builder()
                .id(webhookId)
                .organization(organization)
                .name("Ping Test Webhook")
                .url("https://webhook.site/test")
                .signingSecret("whsec_mocked123456")
                .build();

        when(webhookRepository.findByIdAndOrganizationIdNative(orgId, webhookId)).thenReturn(Optional.of(webhook));
        when(objectMapper.writeValueAsString(any())).thenReturn("{\"event\":\"ping.test_event\"}");

        SSRFSafeHttpClient.HttpResponse mockHttpResp = SSRFSafeHttpClient.HttpResponse.builder()
                .statusCode(200)
                .body("{\"received\":true}")
                .latencyMs(45)
                .success(true)
                .errorMessage(null)
                .resolvedIp("1.2.3.4")
                .build();
        when(httpClient.executePost(eq("https://webhook.site/test"), anyString(), anyMap())).thenReturn(mockHttpResp);

        TestPingResponse pingResponse = webhookService.testPing("cicadas", webhookId);

        assertNotNull(pingResponse);
        assertTrue(pingResponse.isSuccess());
        assertEquals(200, pingResponse.getStatus());
        assertEquals(45, pingResponse.getLatencyMs());
        verify(deliveryRepository).save(any(TenantWebhookDelivery.class));
        verify(webhookRepository).save(webhook);
    }

    @Test
    @DisplayName("Should list delivery history receipts for webhook")
    void testListDeliveries() {
        UUID webhookId = UUID.randomUUID();
        TenantWebhook webhook = TenantWebhook.builder()
                .id(webhookId)
                .organization(organization)
                .build();

        when(webhookRepository.findByIdAndOrganizationIdNative(orgId, webhookId)).thenReturn(Optional.of(webhook));

        TenantWebhookDelivery delivery = TenantWebhookDelivery.builder()
                .id(UUID.randomUUID())
                .webhook(webhook)
                .eventType("network.outage")
                .payload("{\"outage\": true}")
                .responseStatusCode(200)
                .status("SUCCESS")
                .executionDurationMs(32L)
                .deliveredAt(LocalDateTime.now())
                .build();

        when(deliveryRepository.findRecentByWebhookIdNative(webhookId, 50)).thenReturn(List.of(delivery));

        List<WebhookDeliveryResponseDto> deliveries = webhookService.listDeliveries("cicadas", webhookId);

        assertEquals(1, deliveries.size());
        assertEquals("network.outage", deliveries.get(0).getEventType());
        assertEquals(200, deliveries.get(0).getResponseStatusCode());
        assertEquals("SUCCESS", deliveries.get(0).getStatus());
    }
}
