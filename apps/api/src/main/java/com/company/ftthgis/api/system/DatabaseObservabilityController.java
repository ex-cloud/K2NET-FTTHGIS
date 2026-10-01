package com.company.ftthgis.api.system;

import com.company.ftthgis.api.system.dto.DbObservabilityDto.*;
import com.company.ftthgis.service.system.DatabaseObservabilityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for PostgreSQL and storage observability metrics.
 * Acts as a Thin Delegator (<45 lines) dispatching requests to DatabaseObservabilityService.
 */
@RestController
@RequestMapping("/api/v1/system/db-observability")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAuthority('system.observability.view')")
public class DatabaseObservabilityController {

    private final DatabaseObservabilityService databaseObservabilityService;

    @GetMapping
    public ResponseEntity<DbObservabilityResponse> getDbObservability() {
        try {
            return ResponseEntity.ok(databaseObservabilityService.getDbObservability());
        } catch (Exception e) {
            log.error("Failed to gather database observability metrics: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
