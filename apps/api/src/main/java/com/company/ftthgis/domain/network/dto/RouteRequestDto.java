package com.company.ftthgis.domain.network.dto;

import lombok.Data;

@Data
public class RouteRequestDto {
    private double startLon;
    private double startLat;
    private double endLon;
    private double endLat;
}
