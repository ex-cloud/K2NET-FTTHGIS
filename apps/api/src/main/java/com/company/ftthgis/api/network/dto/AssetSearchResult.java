package com.company.ftthgis.api.network.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetSearchResult {
    private String id;
    private String code;
    private String type;
    private double lng;
    private double lat;
    private String status;
    private String projectId;
    private String projectName;
}
