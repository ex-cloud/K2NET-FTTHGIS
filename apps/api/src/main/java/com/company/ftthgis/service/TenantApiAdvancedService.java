package com.company.ftthgis.service;

import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.config.logging.AuditRequired;
import com.company.ftthgis.service.tenantapi.TenantTokenService;
import com.company.ftthgis.service.tenantapi.TenantWebhookConfigService;
import com.company.ftthgis.service.tenantapi.TenantWebhookDispatcherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Thin Facade for Tenant API & Webhook operations.
 * Preserves 100% backward compatibility for existing REST Controllers
 * while delegating domain logic to specialized domain services under com.company.ftthgis.service.tenantapi.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TenantApiAdvancedService {

    private final TenantTokenService tokenService;
    private final TenantWebhookConfigService webhookConfigService;
    private final TenantWebhookDispatcherService webhookDispatcherService;

    // ==========================================
    // 1. Scoped Personal Access Tokens
    // ==========================================

    @Transactional(readOnly = true)
    public List<ScopedTokenResponse> listTokens(String idOrSlug) {
        return tokenService.listTokens(idOrSlug);
    }

    @Transactional
    @AuditRequired(action = "TENANT_SCOPED_TOKEN_CREATED", resourceType = "ORGANIZATION", tenantSlugExpression = "#idOrSlug")
    public ScopedTokenCreateResponse createScopedToken(String idOrSlug, ScopedTokenCreateRequest request) {
        return tokenService.createScopedToken(idOrSlug, request);
    }

    @Transactional
    @AuditRequired(action = "TENANT_SCOPED_TOKEN_REVOKED", resourceType = "ORGANIZATION", tenantSlugExpression = "#idOrSlug")
    public void revokeToken(String idOrSlug, UUID tokenId) {
        tokenService.revokeToken(idOrSlug, tokenId);
    }

    // ==========================================
    // 2. Multi-Endpoint Webhook Router
    // ==========================================

    @Transactional(readOnly = true)
    public List<WebhookEndpointResponse> listEndpoints(String idOrSlug) {
        return webhookConfigService.listEndpoints(idOrSlug);
    }

    @Transactional
    @AuditRequired(action = "TENANT_WEBHOOK_ENDPOINT_CREATED", resourceType = "ORGANIZATION", tenantSlugExpression = "#idOrSlug")
    public WebhookEndpointResponse createEndpoint(String idOrSlug, WebhookEndpointRequest request) {
        return webhookConfigService.createEndpoint(idOrSlug, request);
    }

    @Transactional
    @AuditRequired(action = "TENANT_WEBHOOK_ENDPOINT_UPDATED", resourceType = "ORGANIZATION", tenantSlugExpression = "#idOrSlug")
    public WebhookEndpointResponse updateEndpoint(String idOrSlug, UUID endpointId, WebhookEndpointRequest request) {
        return webhookConfigService.updateEndpoint(idOrSlug, endpointId, request);
    }

    @Transactional
    @AuditRequired(action = "TENANT_WEBHOOK_ENDPOINT_DELETED", resourceType = "ORGANIZATION", tenantSlugExpression = "#idOrSlug")
    public void deleteEndpoint(String idOrSlug, UUID endpointId) {
        webhookConfigService.deleteEndpoint(idOrSlug, endpointId);
    }

    @Transactional
    public RollSecretResponse rollEndpointSecret(String idOrSlug, UUID endpointId) {
        return webhookConfigService.rollEndpointSecret(idOrSlug, endpointId);
    }

    // ==========================================
    // 3. Webhook Dispatcher, Testing, Simulation & DLQ
    // ==========================================

    @Transactional
    public TestPingResponse testPingEndpoint(String idOrSlug, UUID endpointId) {
        return webhookDispatcherService.testPingEndpoint(idOrSlug, endpointId);
    }

    public List<EventSchemaDto> getEventSchemas() {
        return webhookDispatcherService.getEventSchemas();
    }

    @Transactional
    public SimulateEventResponse simulateEventDispatch(String idOrSlug, SimulateEventRequest request) {
        return webhookDispatcherService.simulateEventDispatch(idOrSlug, request);
    }

    @Transactional(readOnly = true)
    public List<DeadLetterLogResponse> getDeadLetterLogs(String idOrSlug) {
        return webhookDispatcherService.getDeadLetterLogs(idOrSlug);
    }

    @Transactional
    public TestPingResponse replayFailedWebhook(String idOrSlug, UUID logId) {
        return webhookDispatcherService.replayFailedWebhook(idOrSlug, logId);
    }

    // ==========================================
    // 4. API Usage & Latency Analytics
    // ==========================================

    @Transactional(readOnly = true)
    public ApiAnalyticsResponse getApiAnalytics(String idOrSlug) {
        return webhookDispatcherService.getApiAnalytics(idOrSlug);
    }

    @Transactional(readOnly = true)
    public ApiAnalyticsResponse getApiAnalytics(String idOrSlug, String rangeStr) {
        return webhookDispatcherService.getApiAnalytics(idOrSlug, rangeStr);
    }
}
