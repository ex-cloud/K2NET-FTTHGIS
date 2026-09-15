package com.company.ftthgis.service;

import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.config.security.WebhookSecurityValidator;
import com.company.ftthgis.domain.tenant.entity.*;
import com.company.ftthgis.domain.tenant.repository.*;
import com.company.ftthgis.util.SecretEncryptionUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantApiAdvancedServiceTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private TenantApiTokenRepository tokenRepository;

    @Mock
    private TenantWebhookEndpointRepository endpointRepository;

    @Mock
    private TenantWebhookLogRepository logRepository;

    @Mock
    private WebhookSecurityValidator securityValidator;

    private SecretEncryptionUtil encryptionUtil;
    private ObjectMapper objectMapper;
    private TenantApiAdvancedService service;

    private Organization testOrg;

    @BeforeEach
    void setUp() {
        encryptionUtil = new SecretEncryptionUtil("test-encryption-secret-key-32-chars!");
        objectMapper = new ObjectMapper();
        service = new TenantApiAdvancedService(
                organizationRepository,
                tokenRepository,
                endpointRepository,
                logRepository,
                securityValidator,
                encryptionUtil,
                objectMapper
        );

        testOrg = Organization.builder()
                .id(UUID.randomUUID())
                .name("Garut Fiber")
                .slug("garut")
                .build();
    }

    @Test
    @DisplayName("Should create Scoped Personal Access Token with Show-Once plaintext return")
    void testCreateScopedToken() {
        when(organizationRepository.findBySlug("garut")).thenReturn(Optional.of(testOrg));
        when(tokenRepository.save(any(TenantApiToken.class))).thenAnswer(inv -> {
            TenantApiToken t = inv.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        ScopedTokenCreateRequest req = ScopedTokenCreateRequest.builder()
                .name("Web Sales Form")
                .scopes(List.of("coverage:read"))
                .expirationDays(90)
                .build();

        ScopedTokenCreateResponse res = service.createScopedToken("garut", req);

        assertNotNull(res);
        assertNotNull(res.getPlainTextToken());
        assertTrue(res.getPlainTextToken().startsWith("k2_tok_garut_"));
        assertEquals("Web Sales Form", res.getName());
        assertEquals(List.of("coverage:read"), res.getScopes());
        assertNotNull(res.getExpiresAt());
    }

    @Test
    @DisplayName("Should create Multi-Endpoint Webhook with SSRF validation")
    void testCreateEndpoint() {
        when(organizationRepository.findBySlug("garut")).thenReturn(Optional.of(testOrg));
        when(endpointRepository.save(any(TenantWebhookEndpoint.class))).thenAnswer(inv -> {
            TenantWebhookEndpoint ep = inv.getArgument(0);
            ep.setId(UUID.randomUUID());
            return ep;
        });

        WebhookEndpointRequest req = WebhookEndpointRequest.builder()
                .name("Billing Bridge")
                .targetUrl("https://billing.garutfiber.net/webhook")
                .isActive(true)
                .build();

        WebhookEndpointResponse res = service.createEndpoint("garut", req);

        verify(securityValidator).validateUrl("https://billing.garutfiber.net/webhook");
        assertNotNull(res);
        assertEquals("Billing Bridge", res.getName());
        assertTrue(res.isHasSecret());
    }

    @Test
    @DisplayName("Should return Event Schemas catalog")
    void testGetEventSchemas() {
        List<EventSchemaDto> schemas = service.getEventSchemas();
        assertNotNull(schemas);
        assertFalse(schemas.isEmpty());
        assertTrue(schemas.stream().anyMatch(s -> s.getEventType().equals("cable.fiber_cut")));
        assertTrue(schemas.stream().anyMatch(s -> s.getEventType().equals("device.olt_down")));
    }

    @Test
    @DisplayName("Should fetch Dead Letter Queue logs")
    void testGetDeadLetterLogs() {
        when(organizationRepository.findBySlug("garut")).thenReturn(Optional.of(testOrg));
        
        TenantWebhookLog dlqItem = TenantWebhookLog.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .eventName("cable.fiber_cut")
                .targetUrl("https://noc.garutfiber.net/alarm")
                .httpStatus(500)
                .latencyMs(120)
                .deliveryStatus("FAILED_DLQ")
                .retryCount(4)
                .maxRetries(4)
                .createdAt(LocalDateTime.now())
                .build();

        when(logRepository.findByOrganizationAndDeliveryStatusOrderByCreatedAtDesc(testOrg, "FAILED_DLQ"))
                .thenReturn(List.of(dlqItem));
        when(logRepository.findByOrganizationAndDeliveryStatusOrderByCreatedAtDesc(testOrg, "RETRYING"))
                .thenReturn(List.of());

        List<DeadLetterLogResponse> logs = service.getDeadLetterLogs("garut");

        assertEquals(1, logs.size());
        assertEquals("FAILED_DLQ", logs.get(0).getDeliveryStatus());
        assertEquals(4, logs.get(0).getRetryCount());
    }
}
