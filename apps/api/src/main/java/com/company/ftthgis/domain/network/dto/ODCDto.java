package com.company.ftthgis.domain.network.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.locationtech.jts.geom.Point;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ODCDto {
    private UUID id;
    private String nodeType;
    private String code;
    private String name;
    
    @JsonIgnore
    private Point geom;
    private Integer capacity;
    private Integer usedCapacity;
    private String status;
    private String healthStatus;

    // Parent OLT Relation
    private UUID oltId;
    private String oltName;
    private String oltCode;
    private String lastNote;
    private Double lat;
    private Double lng;
    private String address;
    @com.fasterxml.jackson.annotation.JsonProperty("projectId")
    @com.fasterxml.jackson.annotation.JsonAlias({"project_id", "projectId"})
    private UUID projectId;
}
