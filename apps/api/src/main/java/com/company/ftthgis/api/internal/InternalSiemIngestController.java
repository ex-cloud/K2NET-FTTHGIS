package com.company.ftthgis.api.internal;

import com.company.ftthgis.api.security.dto.SiemIngestEventRequest;
import com.company.ftthgis.service.siem.SecuritySiemStreamingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

/**
 * Private service-mesh endpoint used by Go gateway-audit (:5009) to forward
 * tenant security events in real time for SIEM streaming (ADR-0031).
 */
@RestController
@RequestMapping("/api/v1/internal/siem")
@RequiredArgsConstructor
@Slf4j
public class InternalSiemIngestController {

    private final SecuritySiemStreamingService siemService;

    @Value("${app.gateway.token:}")
    private String gatewayToken;

    @PostMapping("/ingest")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> ingestEvent(
            @RequestHeader(value = "X-Gateway-Token", required = false) String tokenHeader,
            @Valid @RequestBody SiemIngestEventRequest request) {

        if (!isValidGatewayToken(tokenHeader)) {
            log.warn("🚨 Unauthorized internal SIEM ingest attempt: invalid X-Gateway-Token");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "FORBIDDEN",
                    "message", "Akses internal ditolak: Token gateway tidak valid."
            ));
        }

        int dispatched = siemService.ingestAndDispatch(request);
        return ResponseEntity.accepted().body(Map.of(
                "accepted", true,
                "dispatchedCount", dispatched
        ));
    }

    private boolean isValidGatewayToken(String supplied) {
        if (gatewayToken == null || gatewayToken.isBlank() || supplied == null || supplied.isBlank()) {
            return false;
        }
        return MessageDigest.isEqual(
                gatewayToken.getBytes(StandardCharsets.UTF_8),
                supplied.getBytes(StandardCharsets.UTF_8)
        );
    }
}
