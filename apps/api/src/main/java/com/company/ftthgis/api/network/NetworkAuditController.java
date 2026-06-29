package com.company.ftthgis.api.network;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/network/audit")
@RequiredArgsConstructor
public class NetworkAuditController {

    @GetMapping
    @PreAuthorize("hasAuthority('network.audit')")
    public ResponseEntity<?> getNetworkAuditLog(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(Map.of(
                "page", page,
                "size", size,
                "items", java.util.List.of(),
                "message", "Audit endpoint ready"
        ));
    }

    @GetMapping("/by-asset/{assetId}")
    @PreAuthorize("hasAuthority('network.audit')")
    public ResponseEntity<?> getAuditLogByAsset(@PathVariable String assetId) {
        return ResponseEntity.ok(Map.of(
                "assetId", assetId,
                "items", java.util.List.of(),
                "message", "Asset audit endpoint ready"
        ));
    }
}
