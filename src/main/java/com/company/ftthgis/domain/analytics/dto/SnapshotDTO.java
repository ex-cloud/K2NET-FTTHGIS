package com.company.ftthgis.domain.analytics.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SnapshotDTO {
    private LocalDateTime recordedAt;
    private long totalNodes;
    private long activeNodes;
    private long downNodes;
    private double networkUptime;
}
