package com.company.ftthgis.domain.network.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class FiberCoreDto {
    private UUID id;
    private UUID cableId;
    private String cableCode;
    private Integer coreNumber;
    private String status;
    private String color;
    private Double attenuationDb;
    private UUID fromNodeId;
    private UUID toNodeId;
}
