package com.company.ftthgis.domain.network.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "fiber_splice")
@Getter
@Setter
public class FiberSplice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_core_id", nullable = false)
    private FiberCore fromCore;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_core_id", nullable = false)
    private FiberCore toCore;

    @Column(name = "splice_type")
    private String spliceType; // FUSION, MECHANICAL, CONNECTOR

    @Column(name = "from_port_id")
    private UUID fromPortId;
    
    @Column(name = "to_port_id")
    private UUID toPortId;

    @Column(name = "loss_db")
    private Double lossDb; // Splice attenuation in dB

    @Column(length = 500)
    private String notes; // Technician notes

    @Column(columnDefinition = "geometry(Point, 4326)")
    private Point location;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
