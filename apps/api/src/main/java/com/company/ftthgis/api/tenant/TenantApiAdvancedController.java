package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.service.TenantApiAdvancedService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{idOrSlug}")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('super_admin') or hasAuthority('organizations.update')")
public class TenantApiAdvancedController {

    private final TenantApiAdvancedService advancedService;

    // --- 1. Scoped Personal Access Tokens ---

    @GetMapping("/api-tokens")
    @PreAuthorize("hasRole('super_admin') or hasAnyAuthority('organizations.view', 'organizations.update')")
    public ResponseEntity<List<ScopedTokenResponse>> listTokens(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(advancedService.listTokens(idOrSlug));
    }

    @PostMapping("/api-tokens")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('organizations.update')")
    public ResponseEntity<ScopedTokenCreateResponse> createScopedToken(
            @PathVariable String idOrSlug,
            @RequestBody ScopedTokenCreateRequest request) {
        return ResponseEntity.ok(advancedService.createScopedToken(idOrSlug, request));
    }

    @DeleteMapping("/api-tokens/{tokenId}")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('organizations.update')")
    public ResponseEntity<Void> revokeToken(
            @PathVariable String idOrSlug,
            @PathVariable UUID tokenId) {
        advancedService.revokeToken(idOrSlug, tokenId);
        return ResponseEntity.noContent().build();
    }

    // --- 2. Multi-Endpoint Webhook Router ---

    @GetMapping("/webhook-endpoints")
    @PreAuthorize("hasRole('super_admin') or hasAnyAuthority('organizations.view', 'organizations.update')")
    public ResponseEntity<List<WebhookEndpointResponse>> listEndpoints(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(advancedService.listEndpoints(idOrSlug));
    }

    @PostMapping("/webhook-endpoints")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('organizations.update')")
    public ResponseEntity<WebhookEndpointResponse> createEndpoint(
            @PathVariable String idOrSlug,
            @RequestBody WebhookEndpointRequest request) {
        return ResponseEntity.ok(advancedService.createEndpoint(idOrSlug, request));
    }

    @PutMapping("/webhook-endpoints/{endpointId}")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('organizations.update')")
    public ResponseEntity<WebhookEndpointResponse> updateEndpoint(
            @PathVariable String idOrSlug,
            @PathVariable UUID endpointId,
            @RequestBody WebhookEndpointRequest request) {
        return ResponseEntity.ok(advancedService.updateEndpoint(idOrSlug, endpointId, request));
    }

    @DeleteMapping("/webhook-endpoints/{endpointId}")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('organizations.update')")
    public ResponseEntity<Void> deleteEndpoint(
            @PathVariable String idOrSlug,
            @PathVariable UUID endpointId) {
        advancedService.deleteEndpoint(idOrSlug, endpointId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/webhook-endpoints/{endpointId}/roll-secret")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('organizations.update')")
    public ResponseEntity<RollSecretResponse> rollEndpointSecret(
            @PathVariable String idOrSlug,
            @PathVariable UUID endpointId) {
        return ResponseEntity.ok(advancedService.rollEndpointSecret(idOrSlug, endpointId));
    }

    @PostMapping("/webhook-endpoints/{endpointId}/test-ping")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('organizations.update')")
    public ResponseEntity<TestPingResponse> testPingEndpoint(
            @PathVariable String idOrSlug,
            @PathVariable UUID endpointId) {
        return ResponseEntity.ok(advancedService.testPingEndpoint(idOrSlug, endpointId));
    }

    // --- 3. Event Catalog & Payload Simulator ---

    @GetMapping("/webhooks/event-schemas")
    @PreAuthorize("hasRole('super_admin') or hasAnyAuthority('organizations.view', 'organizations.update')")
    public ResponseEntity<List<EventSchemaDto>> getEventSchemas() {
        return ResponseEntity.ok(advancedService.getEventSchemas());
    }

    @PostMapping("/webhooks/simulate-event")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('organizations.update')")
    public ResponseEntity<SimulateEventResponse> simulateEventDispatch(
            @PathVariable String idOrSlug,
            @RequestBody SimulateEventRequest request) {
        return ResponseEntity.ok(advancedService.simulateEventDispatch(idOrSlug, request));
    }

    // --- 4. Dead Letter Queue & Replay ---

    @GetMapping("/webhooks/dlq-logs")
    @PreAuthorize("hasRole('super_admin') or hasAnyAuthority('organizations.view', 'organizations.update')")
    public ResponseEntity<List<DeadLetterLogResponse>> getDeadLetterLogs(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(advancedService.getDeadLetterLogs(idOrSlug));
    }

    @PostMapping("/webhooks/dlq-logs/{logId}/replay")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('organizations.update')")
    public ResponseEntity<TestPingResponse> replayFailedWebhook(
            @PathVariable String idOrSlug,
            @PathVariable UUID logId) {
        return ResponseEntity.ok(advancedService.replayFailedWebhook(idOrSlug, logId));
    }

    // --- 5. API Usage & Latency Analytics ---

    @GetMapping("/api-analytics")
    @PreAuthorize("hasRole('super_admin') or hasAnyAuthority('organizations.view', 'organizations.update')")
    public ResponseEntity<ApiAnalyticsResponse> getApiAnalytics(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(advancedService.getApiAnalytics(idOrSlug));
    }
}
