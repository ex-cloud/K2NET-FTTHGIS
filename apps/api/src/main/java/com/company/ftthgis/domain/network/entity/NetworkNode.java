package com.company.ftthgis.domain.network.entity;

import com.company.ftthgis.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.locationtech.jts.geom.Point;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "network_nodes")
@SQLDelete(sql = "UPDATE network_nodes SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "node_type")
@EntityListeners(MapCacheEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Audited
public abstract class NetworkNode extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by")
    private String deletedBy;

    @Column(unique = true)
    private Long osmid;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(columnDefinition = "geometry(Point, 4326)", nullable = false)
    private Point geom;

    private Double elevation;

    private String status;

    @Column(name = "health_status")
    private String healthStatus;

    @Column(name = "signal_db")
    private Double signalDb;

    @Column(name = "last_maintenance")
    private java.time.LocalDateTime lastMaintenance;

    @Column(name = "last_note")
    private String lastNote;

    private String address;

    @Column(name = "node_type", insertable = false, updatable = false)
    private String nodeType;
}
