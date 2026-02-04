package com.company.ftthgis.domain.network.entity;

import com.company.ftthgis.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;
import org.locationtech.jts.geom.LineString;

@Entity
@Table(name = "network_edges")
@Getter
@Setter
@Audited
public class FiberCable extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(name = "geom", columnDefinition = "geometry(LineString, 4326)", nullable = false)
    private LineString geometry;

    @Column(name = "geometry_simple", columnDefinition = "geometry(LineString, 4326)")
    private LineString geometrySimple;

    @Column(name = "fiber_count")
    private Integer fiberCount;

    private String status;

    @Column(name = "length_meters")
    private Double lengthMeters;

    // Routing Topology Fields (Mapped to Legacy)
    @Column(name = "source")
    private Integer source;

    @Column(name = "target")
    private Integer target;

    @Column(name = "cost")
    private Double cost;

    @Column(name = "reverse_cost")
    private Double reverseCost;

    @Column(name = "road_type")
    private String roadType;

    @Column(name = "speed_limit")
    private Integer speedLimit;

    private Boolean oneway;
}
