package com.company.ftthgis.domain.network.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.locationtech.jts.geom.LineString;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FiberCableDto {
    private UUID id;
    private String code;
    
    @JsonIgnore
    private LineString geom;
    private Integer fiberCount;
    private String status;
    private Double lengthMeters;
    private String lastNote;
    @com.fasterxml.jackson.annotation.JsonProperty("projectId")
    @com.fasterxml.jackson.annotation.JsonAlias({"project_id", "projectId"})
    private UUID projectId;
}
