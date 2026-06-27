package com.company.ftthgis.domain.analytics.controller;

import com.company.ftthgis.domain.analytics.dto.DashboardStatsDTO;
import com.company.ftthgis.domain.analytics.dto.SnapshotDTO;
import com.company.ftthgis.domain.analytics.entity.NetworkEvent;
import com.company.ftthgis.domain.analytics.repository.NetworkEventRepository;
import com.company.ftthgis.domain.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final NetworkEventRepository networkEventRepository;

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats(@RequestParam(required = false) UUID projectId) {
        return ResponseEntity.ok(analyticsService.getDashboardStats(projectId));
    }

    /**
     * Returns historical dashboard snapshots within a date range.
     * Example: GET
     * /api/v1/analytics/history?from=2026-02-10T00:00:00&to=2026-02-11T23:59:59
     */
    @GetMapping("/history")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<List<SnapshotDTO>> getSnapshotHistory(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) UUID projectId) {
        return ResponseEntity.ok(analyticsService.getSnapshotHistory(from, to, projectId));
    }

    /**
     * Returns individual network events for scatter plot visualization.
     */
    @GetMapping("/events")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<List<NetworkEvent>> getEventHistory(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) UUID projectId) {
        if (projectId != null) {
            return ResponseEntity.ok(networkEventRepository.findByTimestampBetweenAndProjectIdOrderByTimestampAsc(from, to, projectId));
        }
        return ResponseEntity.ok(networkEventRepository.findByTimestampBetweenOrderByTimestampAsc(from, to));
    }
}
