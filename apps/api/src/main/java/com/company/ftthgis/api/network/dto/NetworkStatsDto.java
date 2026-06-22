package com.company.ftthgis.api.network.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class NetworkStatsDto {
    private long totalNodes;
    private long totalOdc;
    private long totalOdp;
    private double totalCableLengthKm;
    private long totalUsers;
    private double growthPercentage;
    private long activeMaintenanceCount;
    private List<CapacityItem> topCapacities;
    private List<MaintenanceItem> activeMaintenances;

    @Data
    @Builder
    public static class CapacityItem {
        private String label;
        private double percentage;
        private String color; // sky, emerald, amber, etc
    }

    @Data
    @Builder
    public static class MaintenanceItem {
        private String id;
        private String code;
        private String type;
        private String description;
        private String severity; // critical, warning, info
    }
}
