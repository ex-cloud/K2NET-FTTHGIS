package com.company.ftthgis.domain.network.entity;

import com.company.ftthgis.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;
import org.locationtech.jts.geom.Point;

@Entity
@Table(name = "network_nodes")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "node_type")
@Getter
@Setter
@Audited
public abstract class NetworkNode extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private Long osmid;

    @Column(columnDefinition = "geometry(Point, 4326)", nullable = false)
    private Point geom;

    private Double elevation;

    private String status;

    @Column(name = "signal_db")
    private Double signalDb;

    @Column(name = "node_type", insertable = false, updatable = false)
    private String nodeType;
}
