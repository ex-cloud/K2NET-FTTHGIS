package com.company.ftthgis.domain.analytics.service;

import com.company.ftthgis.domain.analytics.dto.DashboardStatsDTO;
import com.company.ftthgis.domain.analytics.repository.AnalyticsRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AnalyticsRepository analyticsRepository;
    private final UserRepository userRepository; // Assuming User entity and repository exist

    public DashboardStatsDTO getDashboardStats() {
        long totalNodes = analyticsRepository.countTotalNodes();
        long activeNodes = analyticsRepository.countActiveNodes();
        long downNodes = analyticsRepository.countDownNodes(); // Considered as Active Alerts
        double totalLengthKm = analyticsRepository.calculateTotalNetworkLengthKm();
        long totalUsers = userRepository.count();

        // Calculate simplified Uptime based on active/total nodes
        // In real world, this should be time-series based. Here we use snapshot
        // availability.
        double uptime = totalNodes > 0 ? ((double) activeNodes / totalNodes) * 100 : 100.0;

        return DashboardStatsDTO.builder()
                .totalNodes(totalNodes)
                .activeNodes(activeNodes)
                .totalUsers(totalUsers)
                .totalNetworkLengthKm(Math.round(totalLengthKm * 100.0) / 100.0) // Round to 2 decimals
                .activeAlerts(downNodes)
                .networkUptime(Math.round(uptime * 100.0) / 100.0)
                .customerReach(totalUsers)
                .maintenanceProgress(85.0) // Dummy value for now
                .build();
    }
}
