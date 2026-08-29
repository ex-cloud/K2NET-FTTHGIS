package com.company.ftthgis.domain.network.entity;

import com.company.ftthgis.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.locationtech.jts.geom.LineString;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "network_edges")
@SQLDelete(sql = "UPDATE network_edges SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
@EntityListeners(MapCacheEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Audited
public class FiberCable extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @org.hibernate.envers.NotAudited
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @org.hibernate.envers.NotAudited
    @Column(name = "deleted_by")
    private String deletedBy;

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
