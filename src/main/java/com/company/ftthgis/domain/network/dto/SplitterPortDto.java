package com.company.ftthgis.domain.network.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class SplitterPortDto {
    private UUID id;
    private UUID nodeId;
    private String nodeType;
    private Integer portNumber;
    private String direction;    // IN or OUT
    private String status;       // AVAILABLE, USED, RESERVED, BROKEN
    private String label;
    private UUID connectedCoreId;
    private String connectedCoreName; // Display field: e.g. "Core #3 - FEEDER-ODC-GADUNG"
}
