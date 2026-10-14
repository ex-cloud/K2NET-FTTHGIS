package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.service.tenantapi.TenantWebhookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{idOrSlug}/developer/webhooks")
@RequiredArgsConstructor
@Slf4j
public class TenantWebhookController {

    private final TenantWebhookService webhookService;

    @GetMapping
    @PreAuthorize("hasAuthority('system.organizations.webhooks.manage') or (@tenantSecurity.isOwner(#idOrSlug) and (hasAuthority('feature.integration.open_api') or hasAuthority('organizations.webhooks.manage') or hasAuthority('organizations.view')))")
    public ResponseEntity<List<WebhookResponseDto>> listWebhooks(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(webhookService.listWebhooks(idOrSlug));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('system.organizations.webhooks.manage') or (@tenantSecurity.isOwner(#idOrSlug) and (hasAuthority('feature.integration.open_api') or hasAuthority('organizations.webhooks.manage')))")
    public ResponseEntity<WebhookResponseDto> createWebhook(
            @PathVariable String idOrSlug,
            @Valid @RequestBody CreateWebhookRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(webhookService.createWebhook(idOrSlug, request));
    }

    @PutMapping("/{webhookId}")
    @PreAuthorize("hasAuthority('system.organizations.webhooks.manage') or (@tenantSecurity.isOwner(#idOrSlug) and (hasAuthority('feature.integration.open_api') or hasAuthority('organizations.webhooks.manage')))")
    public ResponseEntity<WebhookResponseDto> updateWebhook(
            @PathVariable String idOrSlug,
            @PathVariable UUID webhookId,
            @Valid @RequestBody CreateWebhookRequest request) {
        return ResponseEntity.ok(webhookService.updateWebhook(idOrSlug, webhookId, request));
    }

    @DeleteMapping("/{webhookId}")
    @PreAuthorize("hasAuthority('system.organizations.webhooks.manage') or (@tenantSecurity.isOwner(#idOrSlug) and (hasAuthority('feature.integration.open_api') or hasAuthority('organizations.webhooks.manage')))")
    public ResponseEntity<Void> deleteWebhook(
            @PathVariable String idOrSlug,
            @PathVariable UUID webhookId) {
        webhookService.deleteWebhook(idOrSlug, webhookId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{webhookId}/roll-secret")
    @PreAuthorize("hasAuthority('system.organizations.webhooks.manage') or (@tenantSecurity.isOwner(#idOrSlug) and (hasAuthority('feature.integration.open_api') or hasAuthority('organizations.webhooks.manage')))")
    public ResponseEntity<RollSecretResponse> rollSecret(
            @PathVariable String idOrSlug,
            @PathVariable UUID webhookId) {
        return ResponseEntity.ok(webhookService.rollSecret(idOrSlug, webhookId));
    }

    @PostMapping("/{webhookId}/test-ping")
    @PreAuthorize("hasAuthority('system.organizations.webhooks.manage') or (@tenantSecurity.isOwner(#idOrSlug) and (hasAuthority('feature.integration.open_api') or hasAuthority('organizations.webhooks.manage')))")
    public ResponseEntity<TestPingResponse> testPing(
            @PathVariable String idOrSlug,
            @PathVariable UUID webhookId) {
        return ResponseEntity.ok(webhookService.testPing(idOrSlug, webhookId));
    }

    @GetMapping("/{webhookId}/deliveries")
    @PreAuthorize("hasAuthority('system.organizations.webhooks.manage') or (@tenantSecurity.isOwner(#idOrSlug) and (hasAuthority('feature.integration.open_api') or hasAuthority('organizations.webhooks.manage') or hasAuthority('organizations.view')))")
    public ResponseEntity<List<WebhookDeliveryResponseDto>> listDeliveries(
            @PathVariable String idOrSlug,
            @PathVariable UUID webhookId) {
        return ResponseEntity.ok(webhookService.listDeliveries(idOrSlug, webhookId));
    }
}
