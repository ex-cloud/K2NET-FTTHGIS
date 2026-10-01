package com.company.ftthgis.api.network;

import com.company.ftthgis.api.network.dto.AssetDetailDto;
import com.company.ftthgis.api.network.dto.AssetSearchResult;
import com.company.ftthgis.api.network.dto.AuditHistoryDto;
import com.company.ftthgis.api.network.dto.BatchUpdateRequest;
import com.company.ftthgis.domain.network.service.NetworkAssetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for FTTH Network Assets.
 * Acts as a Thin Delegator (<100 lines) dispatching requests to NetworkAssetService.
 */
@RestController
@RequestMapping("/api/v1/network/assets")
@RequiredArgsConstructor
@Slf4j
public class NetworkAssetController {

    private final NetworkAssetService networkAssetService;

    @PostMapping("/simulate-failure")
    @PreAuthorize("hasAuthority('network.manage')")
    public ResponseEntity<Map<String, Object>> simulateFailure(
            @RequestParam String targetCode,
            @RequestParam String targetType,
            @RequestParam String status) {
        return ResponseEntity.ok(networkAssetService.simulateFailure(targetCode, targetType, status));
    }

    @PostMapping("/batch-update")
    @PreAuthorize("hasAuthority('network.manage')")
    public ResponseEntity<Map<String, Object>> batchUpdate(@RequestBody BatchUpdateRequest request) {
        Map<String, Object> result = networkAssetService.batchUpdate(request);
        if (Boolean.FALSE.equals(result.get("success")) && "No IDs provided".equals(result.get("message"))) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/batch-delete")
    @PreAuthorize("hasAuthority('network.manage')")
    public ResponseEntity<Map<String, Object>> batchDelete(
            @RequestParam String type,
            @RequestParam String reason,
            @RequestBody List<UUID> ids) {
        return ResponseEntity.ok(networkAssetService.batchDelete(type, reason, ids));
    }

    @GetMapping("/check-code")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<Map<String, Object>> checkAssetCode(@RequestParam String code) {
        Map<String, Object> result = networkAssetService.checkAssetCode(code);
        if (Boolean.FALSE.equals(result.get("exists")) && result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{type}/{id}")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<?> getAssetDetail(
            @PathVariable String type,
            @PathVariable String id) {
        return networkAssetService.getAssetDetail(type, id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/by-code/{type}/{code}")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<AssetDetailDto> getAssetDetailByCode(
            @PathVariable String type,
            @PathVariable String code) {
        return networkAssetService.getAssetDetailByCode(type, code)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{type}/{code}/diagnostics")
    @PreAuthorize("hasAuthority('network.manage')")
    public ResponseEntity<Map<String, Object>> runDiagnostics(
            @PathVariable String type,
            @PathVariable String code) {
        try {
            return ResponseEntity.ok(networkAssetService.runDiagnostics(type, code));
        } catch (Exception e) {
            log.error("CRITICAL: Diagnostics failed for {} - {}", code, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/all-nodes")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<List<AssetSearchResult>> getAllNodes(
            @RequestParam(required = false) String orgSlug,
            @RequestParam(required = false) UUID projectId) {
        return ResponseEntity.ok(networkAssetService.getAllNodes(orgSlug, projectId));
    }

    @GetMapping("/{type}/{code}/history")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<List<AuditHistoryDto>> getAssetHistory(
            @PathVariable String type,
            @PathVariable String code) {
        return ResponseEntity.ok(networkAssetService.getAssetHistory(type, code));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<List<AssetSearchResult>> search(
            @RequestParam String q,
            @RequestParam(required = false) String orgId) {
        return ResponseEntity.ok(networkAssetService.search(q, orgId));
    }
}
