package com.company.ftthgis.api.network.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class AssetDetailDto {
    private String id;
    private String code;
    private String type; // ODC, ODP, CABLE
    private String status;
    private Map<String, Object> properties;
    private String lastMaintenance;
}
