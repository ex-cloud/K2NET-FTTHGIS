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
public class CustomerDto {
    private Long id;
    private String nodeType;
    private String code;
    private String name;
    private String address;
    private Point geom;
    private String status;

    // Parent ODP Relation
    private Long odpId;
    private String odpCode;
}
