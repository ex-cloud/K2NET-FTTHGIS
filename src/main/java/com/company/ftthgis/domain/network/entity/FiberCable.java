package com.company.ftthgis.domain.network.entity;

import com.company.ftthgis.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;
import org.locationtech.jts.geom.LineString;
import java.util.UUID;

@Entity
@Table(name = "network_edges")
@Getter
@Setter
@Audited
public class FiberCable extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

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

    @Column(name = "last_maintenance")
    private java.time.LocalDateTime lastMaintenance;

    @Column(name = "last_note")
    private String lastNote;

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
