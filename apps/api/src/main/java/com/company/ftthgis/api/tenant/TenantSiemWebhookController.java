package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.security.dto.*;
import com.company.ftthgis.config.security.RequireSudoMode;
import com.company.ftthgis.config.tenant.LicenseCheck;
import com.company.ftthgis.service.siem.SecuritySiemStreamingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Tenant-scoped REST API for Real-Time Security Audit Webhook / SIEM Event Streaming (ADR-0031).
 */
@RestController
@RequestMapping("/api/v1/organizations/{slug}/security/siem")
@LicenseCheck(feature = "sso")
@RequiredArgsConstructor
public class TenantSiemWebhookController {

    private final SecuritySiemStreamingService siemService;

    @GetMapping("/endpoints")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('security.policy.view') or hasAuthority('organizations.view'))")
    public ResponseEntity<List<SiemEndpointDto>> listEndpoints(@PathVariable String slug) {
        return ResponseEntity.ok(siemService.listEndpoints(slug));
    }

    @PostMapping("/endpoints")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('security.policy.manage') or hasAuthority('organizations.update'))")
    @RequireSudoMode(action = "tenant.security_siem.create")
    public ResponseEntity<?> createEndpoint(
            @PathVariable String slug,
            @Valid @RequestBody UpsertSiemEndpointRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(siemService.createEndpoint(slug, request, resolveActor(jwt)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/endpoints/{endpointId}")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('security.policy.manage') or hasAuthority('organizations.update'))")
    @RequireSudoMode(action = "tenant.security_siem.update")
    public ResponseEntity<?> updateEndpoint(
            @PathVariable String slug,
            @PathVariable UUID endpointId,
            @Valid @RequestBody UpsertSiemEndpointRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            return ResponseEntity.ok(siemService.updateEndpoint(slug, endpointId, request, resolveActor(jwt)));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/endpoints/{endpointId}")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('security.policy.manage') or hasAuthority('organizations.update'))")
    @RequireSudoMode(action = "tenant.security_siem.delete")
    public ResponseEntity<?> deleteEndpoint(
            @PathVariable String slug,
            @PathVariable UUID endpointId,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            siemService.deleteEndpoint(slug, endpointId, resolveActor(jwt));
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/endpoints/{endpointId}/roll-secret")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('security.policy.manage') or hasAuthority('organizations.update'))")
    @RequireSudoMode(action = "tenant.security_siem.roll_secret")
    public ResponseEntity<?> rollSecret(
            @PathVariable String slug,
            @PathVariable UUID endpointId,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            return ResponseEntity.ok(siemService.rollSecret(slug, endpointId, resolveActor(jwt)));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/endpoints/{endpointId}/re-enable")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('security.policy.manage') or hasAuthority('organizations.update'))")
    @RequireSudoMode(action = "tenant.security_siem.reenable")
    public ResponseEntity<?> reEnableEndpoint(
            @PathVariable String slug,
            @PathVariable UUID endpointId,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            return ResponseEntity.ok(siemService.reEnableEndpoint(slug, endpointId, resolveActor(jwt)));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/endpoints/{endpointId}/test")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('security.policy.manage') or hasAuthority('organizations.update'))")
    public ResponseEntity<?> sendTestEvent(
            @PathVariable String slug,
            @PathVariable UUID endpointId,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            return ResponseEntity.ok(siemService.sendTestEvent(slug, endpointId, resolveActor(jwt)));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/endpoints/{endpointId}/deliveries")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('security.policy.view') or hasAuthority('organizations.view'))")
    public ResponseEntity<?> listDeliveries(
            @PathVariable String slug,
            @PathVariable UUID endpointId,
            @RequestParam(defaultValue = "50") int limit) {
        try {
            return ResponseEntity.ok(siemService.listDeliveries(slug, endpointId, limit));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/endpoints/{endpointId}/deliveries/{deliveryId}/replay")
    @PreAuthorize("@tenantSecurity.isOwner(#slug) and (hasAuthority('security.policy.manage') or hasAuthority('organizations.update'))")
    @RequireSudoMode(action = "tenant.security_siem.replay")
    public ResponseEntity<?> replayDelivery(
            @PathVariable String slug,
            @PathVariable UUID endpointId,
            @PathVariable UUID deliveryId,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            return ResponseEntity.ok(siemService.replayDelivery(slug, endpointId, deliveryId, resolveActor(jwt)));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    private String resolveActor(Jwt jwt) {
        if (jwt == null) {
            return "admin";
        }
        String email = jwt.getClaimAsString("email");
        return (email != null && !email.isBlank()) ? email : jwt.getSubject();
    }
}
