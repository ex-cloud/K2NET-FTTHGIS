package com.company.ftthgis.api.network;

import com.company.ftthgis.domain.network.dto.OltTelemetryStatusDto;
import com.company.ftthgis.domain.network.service.OltTelemetryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/tenant/telemetry/olt")
@RequiredArgsConstructor
public class OltTelemetryController {

    private final OltTelemetryService oltTelemetryService;

    @GetMapping("/{identifier}/status")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<OltTelemetryStatusDto> getOltStatus(@PathVariable String identifier) {
        return ResponseEntity.ok(oltTelemetryService.getOltTelemetryStatus(identifier));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<Map<String, Object>> getTelemetrySummary() {
        return ResponseEntity.ok(oltTelemetryService.getOltTelemetrySummary());
    }
}
