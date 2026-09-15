package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.service.TenantApiWebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organizations/{idOrSlug}")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAuthority('system.organizations.update')")
public class TenantApiWebhookController {

    private final TenantApiWebhookService webhookService;

    @GetMapping("/api-key")
    @PreAuthorize("hasAuthority('system.organizations.update')")
    public ResponseEntity<ApiKeyOverviewResponse> getApiKeyOverview(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(webhookService.getApiKeyOverview(idOrSlug));
    }

    @PostMapping("/api-key/regenerate")
    @PreAuthorize("hasAuthority('system.organizations.update')")
    public ResponseEntity<RegenerateApiKeyResponse> regenerateApiKey(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(webhookService.regenerateApiKey(idOrSlug));
    }

    @GetMapping("/webhook-config")
    @PreAuthorize("hasAuthority('system.organizations.update')")
    public ResponseEntity<WebhookConfigResponse> getWebhookConfig(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(webhookService.getWebhookConfig(idOrSlug));
    }

    @PutMapping("/webhook-config")
    @PreAuthorize("hasAuthority('system.organizations.update')")
    public ResponseEntity<WebhookConfigResponse> updateWebhookConfig(
            @PathVariable String idOrSlug,
            @RequestBody WebhookConfigRequest request) {
        return ResponseEntity.ok(webhookService.updateWebhookConfig(idOrSlug, request));
    }

    @PostMapping("/webhooks/roll-secret")
    @PreAuthorize("hasAuthority('system.organizations.update')")
    public ResponseEntity<RollSecretResponse> rollWebhookSecret(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(webhookService.rollWebhookSecret(idOrSlug));
    }

    @PostMapping("/webhooks/test-ping")
    @PreAuthorize("hasAuthority('system.organizations.update')")
    public ResponseEntity<TestPingResponse> testPingWebhook(
            @PathVariable String idOrSlug,
            @RequestBody(required = false) TestPingRequest request) {
        return ResponseEntity.ok(webhookService.testPingWebhook(idOrSlug, request));
    }

    @GetMapping("/webhook-logs")
    @PreAuthorize("hasAuthority('system.organizations.update')")
    public ResponseEntity<List<TenantWebhookLogResponse>> getWebhookLogs(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(webhookService.getWebhookLogs(idOrSlug));
    }
}
