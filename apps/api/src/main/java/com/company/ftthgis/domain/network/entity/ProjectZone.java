package com.company.ftthgis.domain.network.entity;

import com.company.ftthgis.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.locationtech.jts.geom.Polygon;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "project_zones")
@SQLDelete(sql = "UPDATE project_zones SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@Audited
public class ProjectZone extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, unique = true)
    private UUID id;

    @NotAudited
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @NotAudited
    @Column(name = "deleted_by")
    private String deletedBy;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ZoneStage stage = ZoneStage.PLANNING;

    @Column(name = "boundary_geom", columnDefinition = "geometry(Polygon, 4326)", nullable = false)
    private Polygon boundaryGeom;

    @Column(name = "target_homepass")
    @Builder.Default
    private Integer targetHomepass = 0;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 20)
    @Builder.Default
    private String color = "#3b82f6";

    @Column(name = "promoted_to_construction_at")
    private LocalDateTime promotedToConstructionAt;

    @Column(name = "promoted_to_live_at")
    private LocalDateTime promotedToLiveAt;
}
