package com.company.ftthgis.domain.network.dto;

import lombok.Data;

@Data
public class FiberCoreDto {
    private Long id;
    private Long cableId;
    private String cableCode;
    private Integer coreNumber;
    private String status;
    private String color;
    private Double attenuationDb;
    private Long fromNodeId;
    private Long toNodeId;
}
