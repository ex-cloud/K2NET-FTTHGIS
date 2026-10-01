package com.company.ftthgis.api.system;

import com.company.ftthgis.service.system.DatabaseObservabilityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Database Query Performance and Slow Query Analysis.
 * Acts as a Thin Delegator (<50 lines) dispatching requests to DatabaseObservabilityService.
 */
@RestController
@RequestMapping("/api/v1/system/db-performance")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAuthority('system.observability.view')")
public class DbPerformanceController {

    private final DatabaseObservabilityService databaseObservabilityService;

    @GetMapping("/slow-queries")
    public ResponseEntity<List<Map<String, Object>>> getSlowQueries(
            @RequestParam(value = "limit", defaultValue = "20") int limit,
            @RequestParam(value = "offset", defaultValue = "0") int offset,
            @RequestParam(value = "search", defaultValue = "") String search,
            @RequestParam(value = "sort", defaultValue = "total_time") String sort,
            @RequestParam(value = "role", defaultValue = "") String role,
            @RequestParam(value = "minTotalTime", required = false) Double minTotalTime
    ) {
        return ResponseEntity.ok(databaseObservabilityService.getSlowQueries(limit, offset, search, sort, role, minTotalTime));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDbStats() {
        return ResponseEntity.ok(databaseObservabilityService.getDbStats());
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> resetStats() {
        return ResponseEntity.ok(databaseObservabilityService.resetStats());
    }

    @GetMapping("/spatial-indexes")
    public ResponseEntity<List<Map<String, Object>>> getSpatialIndexes() {
        return ResponseEntity.ok(databaseObservabilityService.getSpatialIndexes());
    }
}
