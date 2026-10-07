package com.company.ftthgis.domain.network.dto;

import com.company.ftthgis.domain.network.entity.ZoneStage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectZoneDto {
    private UUID id;
    private UUID projectId;
    private String name;
    private String code;
    private ZoneStage stage;
    private Integer targetHomepass;
    private String description;
    private String color;
    private String boundaryGeoJson;
    private long odpCount;
    private long odcCount;
    private long cableCount;
    private Double totalCableLengthMeters;
    private LocalDateTime promotedToConstructionAt;
    private LocalDateTime promotedToLiveAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
