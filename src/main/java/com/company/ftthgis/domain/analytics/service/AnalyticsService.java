package com.company.ftthgis.domain.analytics.service;

import com.company.ftthgis.domain.analytics.dto.DashboardStatsDTO;
import com.company.ftthgis.domain.analytics.dto.SnapshotDTO;
import com.company.ftthgis.domain.analytics.entity.DashboardSnapshot;
import com.company.ftthgis.domain.analytics.repository.AnalyticsRepository;
import com.company.ftthgis.domain.analytics.repository.DashboardSnapshotRepository;
import com.company.ftthgis.domain.network.repository.CustomerRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
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

    public DashboardStatsDTO getDashboardStats() {
        long totalNodes = analyticsRepository.countTotalNodes();
        long activeNodes = analyticsRepository.countActiveNodes();
        long downNodes = analyticsRepository.countDownNodes();
        double totalLengthKm = analyticsRepository.calculateTotalNetworkLengthKm();
        long totalUsers = userRepository.count();
        long totalCustomers = customerRepository.count();

        double uptime = totalNodes > 0 ? ((double) activeNodes / totalNodes) * 100 : 100.0;

        log.info(
                "[Analytics] Dashboard Stats Generated: totalNodes={}, activeNodes={}, downNodes={}, uptime={}, users={}",
                totalNodes, activeNodes, downNodes, uptime, totalUsers);

        return DashboardStatsDTO.builder()
                .totalNodes(totalNodes)
                .activeNodes(activeNodes)
                .totalUsers(totalUsers)
                .totalNetworkLengthKm(Math.round(totalLengthKm * 100.0) / 100.0)
                .activeAlerts(downNodes)
                .networkUptime(Math.round(uptime * 100.0) / 100.0)
                .customerReach(totalCustomers)
                .maintenanceProgress(85.0)
                .build();
    }

    // ─── Snapshot History ─────────────────────────────────────────────────

    /**
     * Records a snapshot of the current dashboard metrics every 5 minutes.
     */
    @Scheduled(fixedRate = 300_000) // every 5 minutes
    @Transactional
    public void recordSnapshot() {
        long totalNodes = analyticsRepository.countTotalNodes();
        long activeNodes = analyticsRepository.countActiveNodes();
        long downNodes = analyticsRepository.countDownNodes();
        double totalLengthKm = analyticsRepository.calculateTotalNetworkLengthKm();
        long totalCustomers = customerRepository.count();

        double uptime = totalNodes > 0 ? ((double) activeNodes / totalNodes) * 100 : 100.0;

        DashboardSnapshot snapshot = DashboardSnapshot.builder()
                .recordedAt(LocalDateTime.now())
                .totalNodes(totalNodes)
                .activeNodes(activeNodes)
                .downNodes(downNodes)
                .networkUptime(Math.round(uptime * 100.0) / 100.0)
                .customerReach(totalCustomers)
                .totalNetworkLengthKm(Math.round(totalLengthKm * 100.0) / 100.0)
                .build();

        snapshotRepository.save(snapshot);
        log.debug("[Analytics] Dashboard snapshot recorded at {}", snapshot.getRecordedAt());
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
    public List<SnapshotDTO> getSnapshotHistory(LocalDateTime from, LocalDateTime to) {
        List<DashboardSnapshot> snapshots = snapshotRepository.findByRecordedAtBetweenOrderByRecordedAtAsc(from, to);

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
