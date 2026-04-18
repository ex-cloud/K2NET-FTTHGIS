package com.company.ftthgis.domain.analytics.service;

import com.company.ftthgis.domain.analytics.dto.DashboardStatsDTO;
import com.company.ftthgis.domain.analytics.dto.IssueDetailDTO;
import com.company.ftthgis.domain.analytics.dto.SnapshotDTO;
import org.springframework.data.domain.PageRequest;
import com.company.ftthgis.domain.analytics.entity.DashboardSnapshot;
import com.company.ftthgis.domain.analytics.repository.AnalyticsRepository;
import com.company.ftthgis.domain.analytics.repository.DashboardSnapshotRepository;
import com.company.ftthgis.domain.network.repository.CustomerRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import com.company.ftthgis.domain.tenant.entity.Project;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final AnalyticsRepository analyticsRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final DashboardSnapshotRepository snapshotRepository;
    private final ProjectRepository projectRepository;

    public DashboardStatsDTO getDashboardStats(String projectId) {
        if (projectId == null || projectId.isEmpty()) {
            return getGlobalDashboardStats();
        }

        long totalNodes = analyticsRepository.countTotalNodes(projectId);
        long activeNodes = analyticsRepository.countActiveNodes(projectId);
        long downNodes = analyticsRepository.countDownNodes(projectId);
        double totalLengthKm = analyticsRepository.calculateTotalNetworkLengthKm(projectId);
        
        // Use repo method for project-specific customer count
        long totalCustomers = customerRepository.countByProjectId(projectId);
        // Users are currently global in the system auth, but we could filter by project assignment if needed.
        // For now, keep totalUsers as is or filter if Project has user relations.
        long totalUsers = userRepository.count(); 

        double uptime = totalNodes > 0 ? ((double) activeNodes / totalNodes) * 100 : 100.0;

        log.info(
                "[Analytics] Project Dashboard Stats Generated for {}: totalNodes={}, activeNodes={}, downNodes={}, uptime={}",
                projectId, totalNodes, activeNodes, downNodes, uptime);

        return DashboardStatsDTO.builder()
                .totalNodes(totalNodes)
                .activeNodes(activeNodes)
                .totalUsers(totalUsers)
                .totalNetworkLengthKm(Math.round(totalLengthKm * 100.0) / 100.0)
                .activeAlerts(downNodes)
                .networkUptime(Math.round(uptime * 100.0) / 100.0)
                .customerReach(totalCustomers)
                .maintenanceProgress(85.0)
                .issues(analyticsRepository.findTop10ProblematicNodes(projectId, PageRequest.of(0, 10)).stream()
                        .map(n -> IssueDetailDTO.builder()
                                .code(n.getCode())
                                .type(n.getNodeType())
                                .status(n.getStatus())
                                .lastNote(n.getLastNote())
                                .lng(n.getGeom().getX())
                                .lat(n.getGeom().getY())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    private DashboardStatsDTO getGlobalDashboardStats() {
        // Fallback or Admin view
        return DashboardStatsDTO.builder()
                .totalNodes(0)
                .activeNodes(0)
                .build();
    }

    // ─── Snapshot History ─────────────────────────────────────────────────

    /**
     * Records a snapshot of the current dashboard metrics every 5 minutes.
     */
    @Scheduled(fixedRate = 300_000) // every 5 minutes
    @Transactional
    public void recordSnapshot() {
        List<Project> projects = projectRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (Project project : projects) {
            String projectId = project.getId();
            try {
                long totalNodes = analyticsRepository.countTotalNodes(projectId);
                long activeNodes = analyticsRepository.countActiveNodes(projectId);
                long downNodes = analyticsRepository.countDownNodes(projectId);
                double totalLengthKm = analyticsRepository.calculateTotalNetworkLengthKm(projectId);
                long totalCustomers = customerRepository.countByProjectId(projectId);

                double uptime = totalNodes > 0 ? ((double) activeNodes / totalNodes) * 100 : 100.0;

                DashboardSnapshot snapshot = DashboardSnapshot.builder()
                        .projectId(projectId)
                        .recordedAt(now)
                        .totalNodes(totalNodes)
                        .activeNodes(activeNodes)
                        .downNodes(downNodes)
                        .networkUptime(Math.round(uptime * 100.0) / 100.0)
                        .customerReach(totalCustomers)
                        .totalNetworkLengthKm(Math.round(totalLengthKm * 100.0) / 100.0)
                        .build();

                snapshotRepository.save(snapshot);
            } catch (Exception e) {
                log.error("[Analytics] Failed to record snapshot for project {}: {}", projectId, e.getMessage());
            }
        }
        log.debug("[Analytics] Dashboard snapshots recorded for {} projects at {}", projects.size(), now);
    }

    /**
     * Cleanup snapshots older than 90 days, runs daily at 2 AM.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupOldSnapshots() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(90);
        long deleted = snapshotRepository.deleteByRecordedAtBefore(cutoff);
        if (deleted > 0) {
            log.info("[Analytics] Deleted {} old snapshots before {}", deleted, cutoff);
        }
    }

    /**
     * Retrieves snapshots within a date range for the frontend history chart.
     */
    public List<SnapshotDTO> getSnapshotHistory(LocalDateTime from, LocalDateTime to, String projectId) {
        if (projectId == null || projectId.isEmpty()) {
            return List.of();
        }
        List<DashboardSnapshot> snapshots = snapshotRepository.findByRecordedAtBetweenAndProjectIdOrderByRecordedAtAsc(from, to, projectId);

        return snapshots.stream()
                .map(s -> SnapshotDTO.builder()
                        .recordedAt(s.getRecordedAt())
                        .totalNodes(s.getTotalNodes())
                        .activeNodes(s.getActiveNodes())
                        .downNodes(s.getDownNodes())
                        .networkUptime(s.getNetworkUptime())
                        .build())
                .collect(Collectors.toList());
    }
}
