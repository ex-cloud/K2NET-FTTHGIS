package com.company.ftthgis.domain.network.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OltTelemetryStatusDto {
    private UUID oltId;
    private String code;
    private String name;
    private String ipAddress;
    private String status;
    private String snmpStatus;
    private Long uptimeSeconds;
    private String formattedUptime;
    private Double cpuUsagePercent;
    private Double temperatureCelsius;
    private Double responseTimeMs;
    private Integer ponPortsTotal;
    private Integer ponPortsActive;
    private Integer totalOnts;
    private Integer activeOnts;
    private Double txOpticalPowerDbm;
    private Double rxOpticalPowerAvgDbm;
    private List<OltPonPortMetricDto> portMetrics;
    private Instant lastPolledAt;
    private Boolean isLiveFromPoller;
    private String sysDescr;
}
