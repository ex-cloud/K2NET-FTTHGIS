package com.company.ftthgis.domain.network.dto;

import lombok.Data;

@Data
public class SplitterPortDto {
    private Long id;
    private Long nodeId;
    private String nodeType;
    private Integer portNumber;
    private String direction;    // IN or OUT
    private String status;       // AVAILABLE, USED, RESERVED, BROKEN
    private String label;
    private Long connectedCoreId;
    private String connectedCoreName; // Display field: e.g. "Core #3 - FEEDER-ODC-GADUNG"
}
