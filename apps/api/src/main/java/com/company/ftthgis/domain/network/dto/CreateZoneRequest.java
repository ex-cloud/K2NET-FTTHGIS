package com.company.ftthgis.domain.network.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateZoneRequest {

    @NotBlank(message = "Zone name is required")
    private String name;

    @NotBlank(message = "Zone code is required")
    private String code;

    private Integer targetHomepass;
    private String description;
    private String color;

    /**
     * Polygon coordinates formatted as List of [lng, lat] pairs.
     * The first and last coordinate must match (closed polygon).
     */
    @NotNull(message = "Boundary coordinates are required")
    private List<List<Double>> coordinates;
}
