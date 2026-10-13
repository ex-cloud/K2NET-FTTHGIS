package com.company.ftthgis.domain.network.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OltPonPortMetricDto {
    private Integer portNumber;
    private String portName;
    private String adminStatus;
    private String operStatus;
    private Integer activeOnts;
    private Integer maxOnts;
    private Double txPowerDbm;
    private Double rxAvgPowerDbm;
    private String signalQuality;
}
