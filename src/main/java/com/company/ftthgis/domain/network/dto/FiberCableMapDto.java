package com.company.ftthgis.domain.network.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.locationtech.jts.geom.LineString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FiberCableMapDto {
    private Long id;
    private String code;
    private LineString geometry; // This relies on the service to populate it with simple/full geom
    private String status;
}
