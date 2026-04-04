package com.company.ftthgis.domain.network.dto;

import lombok.Data;

@Data
public class FiberSpliceDto {
    private Long id;
    private Long fromCoreId;
    private Long toCoreId;
    private Long fromPortId;
    private Long toPortId;
    private String spliceType;  // FUSION, MECHANICAL, CONNECTOR
    private Double lossDb;
    private String notes;

    // Display fields
    private String fromCoreName; // e.g. "Core #3 (Blue) - FEEDER-ODC-GADUNG"
    private String toCoreName;
    private String fromPortName; // e.g. "Port 1 (OUT) - ODC-GADUNG-01"
    private String toPortName;
}
