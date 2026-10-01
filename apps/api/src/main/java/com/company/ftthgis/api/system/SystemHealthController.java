package com.company.ftthgis.api.system;

import com.company.ftthgis.service.system.SystemHealthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST Controller for System Health and Admin Overview Metrics.
 * Acts as a Thin Delegator (<50 lines) dispatching requests to SystemHealthService.
 */
@RestController
@RequestMapping("/api/v1/system/health-metrics")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAuthority('system.observability.view')")
public class SystemHealthController {

    private final SystemHealthService systemHealthService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getSystemMetrics() {
        return ResponseEntity.ok(systemHealthService.getSystemMetrics());
    }
}
