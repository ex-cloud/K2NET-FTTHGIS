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
    @DisplayName("Should list Scoped Personal Access Tokens using native query")
    void testListTokens() {
        when(organizationRepository.findBySlug("garut")).thenReturn(Optional.of(testOrg));

        TenantApiToken token = TenantApiToken.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .name("Sales Bot")
                .tokenPrefix("k2_tok_garut_")
                .tokenLast4("1234")
                .scopes("[\"coverage:read\"]")
                .isRevoked(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(tokenRepository.findByOrganizationIdNative(testOrg.getId()))
                .thenReturn(List.of(token));

        List<ScopedTokenResponse> tokens = service.listTokens("garut");

        assertNotNull(tokens);
        assertEquals(1, tokens.size());
        assertEquals("Sales Bot", tokens.get(0).getName());
        assertEquals(List.of("coverage:read"), tokens.get(0).getScopes());
    }

    @Test
    @DisplayName("Should list Webhook Endpoints using native query")
    void testListEndpoints() {
        when(organizationRepository.findBySlug("garut")).thenReturn(Optional.of(testOrg));

        TenantWebhookEndpoint endpoint = TenantWebhookEndpoint.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .name("NOC Slack")
                .targetUrl("https://slack.com/webhook")
                .webhookSecretEncrypted(encryptionUtil.encrypt("whsec_secret"))
                .isActive(true)
                .subscribedEvents("{\"fiberCut\":true}")
                .createdAt(LocalDateTime.now())
                .build();

        when(endpointRepository.findByOrganizationIdNative(testOrg.getId()))
                .thenReturn(List.of(endpoint));

        List<WebhookEndpointResponse> endpoints = service.listEndpoints("garut");

        assertNotNull(endpoints);
        assertEquals(1, endpoints.size());
        assertEquals("NOC Slack", endpoints.get(0).getName());
        assertTrue(endpoints.get(0).isHasSecret());
    }

    @Test
    @DisplayName("Should fetch Dead Letter Queue logs using native query")
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

        when(logRepository.findByStatusAndOrganizationIdNative(testOrg.getId(), "FAILED_DLQ", 100))
                .thenReturn(List.of(dlqItem));
        when(logRepository.findByStatusAndOrganizationIdNative(testOrg.getId(), "RETRYING", 100))
                .thenReturn(List.of());

        List<DeadLetterLogResponse> logs = service.getDeadLetterLogs("garut");

        assertEquals(1, logs.size());
        assertEquals("FAILED_DLQ", logs.get(0).getDeliveryStatus());
        assertEquals(4, logs.get(0).getRetryCount());
    }

    @Test
    @DisplayName("Should calculate API Analytics with time-range window")
    void testGetApiAnalytics() {
        when(organizationRepository.findBySlug("garut")).thenReturn(Optional.of(testOrg));
        when(tokenRepository.countActiveByOrganizationIdNative(testOrg.getId())).thenReturn(2L);
        when(endpointRepository.countActiveByOrganizationIdNative(testOrg.getId())).thenReturn(1L);
        when(logRepository.countByStatusAndOrganizationIdNative(testOrg.getId(), "RETRYING")).thenReturn(0L);
        when(logRepository.countByStatusAndOrganizationIdNative(testOrg.getId(), "FAILED_DLQ")).thenReturn(0L);
        when(logRepository.countBetweenNative(eq(testOrg.getId()), any(), any())).thenReturn(100L);
        when(logRepository.countByStatusBetweenNative(eq(testOrg.getId()), eq("FAILED_DLQ"), any(), any())).thenReturn(2L);
        when(logRepository.calculateP95LatencyMsBetweenNative(eq(testOrg.getId()), any(), any())).thenReturn(45.0);
        when(logRepository.countByStatusRangeBetweenNative(eq(testOrg.getId()), eq(200), eq(299), any(), any())).thenReturn(95L);
        when(logRepository.countByStatusRangeBetweenNative(eq(testOrg.getId()), eq(400), eq(499), any(), any())).thenReturn(3L);
        when(logRepository.countByStatusRangeBetweenNative(eq(testOrg.getId()), eq(500), eq(599), any(), any())).thenReturn(2L);
        when(logRepository.findDailyVolumeBetweenNative(eq(testOrg.getId()), any(), any())).thenReturn(List.of());

        ApiAnalyticsResponse analytics = service.getApiAnalytics("garut", "24h");

        assertNotNull(analytics);
        assertEquals(100L, analytics.getTotalRequests24h());
        assertEquals(45, analytics.getP95LatencyMs());
        assertEquals(2L, analytics.getActiveTokensCount());
        assertEquals(1L, analytics.getActiveEndpointsCount());
        assertEquals(95.0, analytics.getSuccessRatePercent());
    }
}
