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
public class CustomerDto {
    private UUID id;
    private String nodeType;
    private String code;
    private String name;
    private String address;
    
    @JsonIgnore
    private Point geom;
    
    private String status;
    private String healthStatus;

    // Parent ODP Relation
    private UUID odpId;
    private String odpCode;
    private String lastNote;
    private Double lat;
    private Double lng;
    @com.fasterxml.jackson.annotation.JsonProperty("projectId")
    @com.fasterxml.jackson.annotation.JsonAlias({"project_id", "projectId"})
    private UUID projectId;
}
