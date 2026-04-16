package com.company.ftthgis.domain.network.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.locationtech.jts.geom.Point;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ODPDto {
    private Long id;
    private String nodeType;
    private Long osmid;
    private String code;
    
    @JsonIgnore
    private Point geom;
    private Integer totalPort;
    private Integer usedPort;
    private String status;

    // Parent ODC Relation
    private Long odcId;
    private String odcName;
    private String odcCode;
    private String lastNote;
    private Double lat;
    private Double lng;
}
