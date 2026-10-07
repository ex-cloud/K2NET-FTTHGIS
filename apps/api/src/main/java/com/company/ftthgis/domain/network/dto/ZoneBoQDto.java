package com.company.ftthgis.domain.network.dto;

import com.company.ftthgis.domain.network.entity.ZoneStage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZoneBoQDto {
    private UUID zoneId;
    private String zoneName;
    private String zoneCode;
    private ZoneStage stage;
    private Double totalFeederCableMeters;
    private Double totalDistributionCableMeters;
    private Double totalDropCableMeters;
    private Double totalCableMeters;
    private Double totalCableKm;
    private long totalOdcCount;
    private long totalOdpCount;
    private long totalSplitterPorts;
    private long totalUsedPorts;
    private Integer targetHomepass;
    private Double homepassCapacityRatioPercent;
    private long estimatedPoleCount;
}
