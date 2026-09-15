package com.company.ftthgis.service;

import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.config.security.WebhookSecurityValidator;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookConfig;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookLog;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.TenantWebhookConfigRepository;
import com.company.ftthgis.domain.tenant.repository.TenantWebhookLogRepository;
import com.company.ftthgis.util.SecretEncryptionUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantApiWebhookServiceTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private TenantWebhookConfigRepository configRepository;

    @Mock
    private TenantWebhookLogRepository logRepository;

    @Mock
    private WebhookSecurityValidator securityValidator;

    private SecretEncryptionUtil encryptionUtil;
    private ObjectMapper objectMapper;
    private TenantApiWebhookService service;

    private Organization testOrg;
    private TenantWebhookConfig testConfig;

    @BeforeEach
    void setUp() {
        encryptionUtil = new SecretEncryptionUtil("test-encryption-secret-key-32-chars!");
        objectMapper = new ObjectMapper();
        service = new TenantApiWebhookService(
                organizationRepository,
                configRepository,
                logRepository,
                securityValidator,
                encryptionUtil,
                objectMapper
        );

        testOrg = Organization.builder()
                .id(UUID.randomUUID())
                .name("Garut Fiber")
                .slug("garut")
                .realmKey("garut-realm")
                .build();

        testConfig = TenantWebhookConfig.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .apiKeyHash(encryptionUtil.sha256Hex("k2_live_garut_1234567890abcdef"))
                .apiKeyPrefix("k2_live_garut_")
                .apiKeyLast4("cdef")
                .rateLimitPerMinute(5000)
                .isActive(true)
                .webhookUrl("https://noc.garutfiber.net/webhook")
                .webhookSecretEncrypted(encryptionUtil.encrypt("whsec_garut_secret123"))
                .subscribedEvents("{\"fiberCut\": true, \"oltDown\": true, \"odpFull\": true, \"quotaAlert\": false}")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        lenient().when(configRepository.findByOrganizationIdNative(any(UUID.class))).thenReturn(Optional.of(testConfig));
        lenient().when(configRepository.findByOrganization(any(Organization.class))).thenReturn(Optional.of(testConfig));
    }

    @Test
    @DisplayName("Should return masked API key overview")
    void testGetApiKeyOverview() {
        when(organizationRepository.findBySlug("garut")).thenReturn(Optional.of(testOrg));

        ApiKeyOverviewResponse response = service.getApiKeyOverview("garut");

        assertNotNull(response);
        assertEquals("k2_live_garut_", response.getApiKeyPrefix());
        assertEquals("cdef", response.getApiKeyLast4());
        assertEquals(5000, response.getRateLimitPerMinute());
        assertTrue(response.isHasActiveKey());
        assertTrue(response.getMaskedApiKey().contains("••••••••"));
    }

    @Test
    @DisplayName("Should regenerate API key with Show-Once plaintext return and SHA-256 hash in DB")
    void testRegenerateApiKey() {
        when(organizationRepository.findBySlug("garut")).thenReturn(Optional.of(testOrg));
        when(configRepository.save(any(TenantWebhookConfig.class))).thenAnswer(inv -> inv.getArgument(0));

        RegenerateApiKeyResponse response = service.regenerateApiKey("garut");

        assertNotNull(response);
        assertNotNull(response.getPlainTextApiKey());
        assertTrue(response.getPlainTextApiKey().startsWith("k2_live_garut_"));

        ArgumentCaptor<TenantWebhookConfig> captor = ArgumentCaptor.forClass(TenantWebhookConfig.class);
        verify(configRepository).save(captor.capture());
        TenantWebhookConfig saved = captor.getValue();

        // Verify that plaintext key is NOT stored in DB, only its SHA-256 hash
        assertEquals(encryptionUtil.sha256Hex(response.getPlainTextApiKey()), saved.getApiKeyHash());
    }

    @Test
    @DisplayName("Should roll HMAC Webhook Secret with AES-256-GCM encryption at rest")
    void testRollWebhookSecret() {
        when(organizationRepository.findBySlug("garut")).thenReturn(Optional.of(testOrg));
        when(configRepository.save(any(TenantWebhookConfig.class))).thenAnswer(inv -> inv.getArgument(0));

        RollSecretResponse response = service.rollWebhookSecret("garut");

        assertNotNull(response);
        assertNotNull(response.getPlainTextSecret());
        assertTrue(response.getPlainTextSecret().startsWith("whsec_garut_"));

        ArgumentCaptor<TenantWebhookConfig> captor = ArgumentCaptor.forClass(TenantWebhookConfig.class);
        verify(configRepository).save(captor.capture());
        TenantWebhookConfig saved = captor.getValue();

        // Verify decryption works
        String decrypted = encryptionUtil.decrypt(saved.getWebhookSecretEncrypted());
        assertEquals(response.getPlainTextSecret(), decrypted);
    }

    @Test
    @DisplayName("Should update webhook config after validating URL against SSRF")
    void testUpdateWebhookConfig() {
        when(organizationRepository.findBySlug("garut")).thenReturn(Optional.of(testOrg));
        when(configRepository.save(any(TenantWebhookConfig.class))).thenAnswer(inv -> inv.getArgument(0));

        WebhookConfigRequest request = WebhookConfigRequest.builder()
                .webhookUrl("https://noc.example.com/api/alerts")
                .isActive(true)
                .subscribedEvents(Map.of("fiberCut", true, "oltDown", false))
                .build();

        WebhookConfigResponse response = service.updateWebhookConfig("garut", request);

        verify(securityValidator).validateUrl("https://noc.example.com/api/alerts");
        assertNotNull(response);
        assertEquals("https://noc.example.com/api/alerts", response.getWebhookUrl());
    }

    @Test
    @DisplayName("Should retrieve recent delivery logs")
    void testGetWebhookLogs() {
        when(organizationRepository.findBySlug("garut")).thenReturn(Optional.of(testOrg));
        
        TenantWebhookLog log1 = TenantWebhookLog.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .eventName("ping.test_event")
                .targetUrl("https://noc.garutfiber.net/webhook")
                .httpStatus(200)
                .latencyMs(35)
                .createdAt(LocalDateTime.now())
                .build();

        when(logRepository.findTop20ByOrganizationOrderByCreatedAtDesc(testOrg)).thenReturn(List.of(log1));

        List<TenantWebhookLogResponse> logs = service.getWebhookLogs("garut");

        assertEquals(1, logs.size());
        assertEquals("ping.test_event", logs.get(0).getEvent());
        assertEquals(200, logs.get(0).getStatus());
        assertEquals(35, logs.get(0).getLatencyMs());
    }
}
