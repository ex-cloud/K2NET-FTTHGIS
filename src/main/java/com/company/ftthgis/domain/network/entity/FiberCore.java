package com.company.ftthgis.domain.network.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "fiber_core")
@Getter
@Setter
public class FiberCore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cable_id", nullable = false)
    private FiberCable cable;

    @Column(name = "core_number", nullable = false)
    private Integer coreNumber;

    @Column(nullable = false)
    private String status; // USED, BROKEN, RESERVED, AVAILABLE

    @Column(length = 20)
    private String color; // Blue, Orange, Green, Brown, Slate, White, Red, Black

    @Column(name = "attenuation_db")
    private Double attenuationDb; // Loss per km (dB/km)

    // Basic connectivity info
    @Column(name = "from_node_id")
    private Long fromNodeId; 

    @Column(name = "to_node_id")
    private Long toNodeId;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (status == null) status = "AVAILABLE";
    }
}
