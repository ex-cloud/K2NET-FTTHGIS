package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.tenant.dto.ApiKeyResponseDto;
import com.company.ftthgis.api.tenant.dto.CreateApiKeyRequest;
import com.company.ftthgis.service.tenantapi.TenantApiKeyService;
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
@RequestMapping("/api/v1/organizations/{idOrSlug}/developer/api-keys")
@RequiredArgsConstructor
@Slf4j
public class TenantApiKeyController {

    private final TenantApiKeyService apiKeyService;

    @GetMapping
    @PreAuthorize("hasAuthority('system.organizations.webhooks.manage') or (@tenantSecurity.isOwner(#idOrSlug) and (hasAuthority('feature.integration.open_api') or hasAuthority('organizations.webhooks.manage') or hasAuthority('organizations.view')))")
    public ResponseEntity<List<ApiKeyResponseDto>> listApiKeys(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(apiKeyService.listApiKeys(idOrSlug));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('system.organizations.webhooks.manage') or (@tenantSecurity.isOwner(#idOrSlug) and (hasAuthority('feature.integration.open_api') or hasAuthority('organizations.webhooks.manage')))")
    public ResponseEntity<ApiKeyResponseDto> createApiKey(
            @PathVariable String idOrSlug,
            @Valid @RequestBody CreateApiKeyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(apiKeyService.createApiKey(idOrSlug, request));
    }

    @PostMapping("/{keyId}/revoke")
    @PreAuthorize("hasAuthority('system.organizations.webhooks.manage') or (@tenantSecurity.isOwner(#idOrSlug) and (hasAuthority('feature.integration.open_api') or hasAuthority('organizations.webhooks.manage')))")
    public ResponseEntity<Void> revokeApiKey(
            @PathVariable String idOrSlug,
            @PathVariable UUID keyId) {
        apiKeyService.revokeApiKey(idOrSlug, keyId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{keyId}")
    @PreAuthorize("hasAuthority('system.organizations.webhooks.manage') or (@tenantSecurity.isOwner(#idOrSlug) and (hasAuthority('feature.integration.open_api') or hasAuthority('organizations.webhooks.manage')))")
    public ResponseEntity<Void> deleteApiKey(
            @PathVariable String idOrSlug,
            @PathVariable UUID keyId) {
        apiKeyService.deleteApiKey(idOrSlug, keyId);
        return ResponseEntity.noContent().build();
    }
}
