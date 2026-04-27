package com.company.ftthgis.domain.network.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class FiberSpliceDto {
    private UUID id;
    private UUID fromCoreId;
    private UUID toCoreId;
    private UUID fromPortId;
    private UUID toPortId;
    private String spliceType;  // FUSION, MECHANICAL, CONNECTOR
    private Double lossDb;
    private String notes;

    // Display fields
    private String fromCoreName; // e.g. "Core #3 (Blue) - FEEDER-ODC-GADUNG"
    private String toCoreName;
    private String fromPortName; // e.g. "Port 1 (OUT) - ODC-GADUNG-01"
    private String toPortName;
}
