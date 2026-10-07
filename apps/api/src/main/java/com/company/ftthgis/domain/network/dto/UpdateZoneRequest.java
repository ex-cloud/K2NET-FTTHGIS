package com.company.ftthgis.domain.network.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateZoneRequest {
    private String name;
    private Integer targetHomepass;
    private String description;
    private String color;
    private List<List<Double>> coordinates;
}
