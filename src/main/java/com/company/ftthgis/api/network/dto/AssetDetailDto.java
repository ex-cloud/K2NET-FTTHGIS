package com.company.ftthgis.api.network.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetDetailDto {
    private String id;
    private String code;
    private String name;
    private String type; // OLT, ODC, ODP, CUSTOMER, CABLE
    private String status;
    private java.util.List<String> labels;
    private Map<String, Object> attributes;
    private String lastMaintenance;
    private Double lat;
    private Double lng;
}
