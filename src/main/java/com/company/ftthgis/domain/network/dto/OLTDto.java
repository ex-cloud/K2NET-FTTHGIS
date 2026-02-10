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
public class OLTDto {
    private Long id;
    private String nodeType;
    private String code;
    private String name;
    private String ipAddress;
    private String snmpCommunity;
    private String status;
    private Point geom;
}
