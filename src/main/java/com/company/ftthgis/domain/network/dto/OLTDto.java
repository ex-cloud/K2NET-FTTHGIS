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
public class OLTDto {
    private UUID id;
    private String nodeType;
    private String code;
    private String name;
    private String ipAddress;
    private String snmpCommunity;
    private String status;
    private String healthStatus;
    
    @JsonIgnore
    private Point geom;
    
    private String lastNote;
    private Double lat;
    private Double lng;
    private String address;
}
