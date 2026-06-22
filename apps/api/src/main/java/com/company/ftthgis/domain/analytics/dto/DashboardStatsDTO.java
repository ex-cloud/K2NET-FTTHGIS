package com.company.ftthgis.domain.analytics.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class DashboardStatsDTO {
    private long totalNodes;
    private long activeNodes;
    private long totalUsers;
    private double totalNetworkLengthKm;
    private long activeAlerts;
    private double networkUptime; // Percentage
    private long customerReach; // Same as totalUsers but for UI consistency
    private double maintenanceProgress; // Dummy percentage
    private List<IssueDetailDTO> issues;
}
