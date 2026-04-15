package com.company.ftthgis.domain.network.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.locationtech.jts.geom.Point;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ODCDto {
    private Long id;
    private String nodeType;
    private String code;
    private String name;
    private Point geom;
    private Integer capacity;
    private Integer usedCapacity;
    private String status;

    // Parent OLT Relation
    private Long oltId;
    private String oltName;
    private String oltCode;
    private String lastNote;
    private Double lat;
    private Double lng;
}
