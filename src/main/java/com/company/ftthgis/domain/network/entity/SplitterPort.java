package com.company.ftthgis.domain.network.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "splitter_port", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"node_id", "port_number", "direction"})
})
@Getter
@Setter
public class SplitterPort {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "node_id", nullable = false)
    private Long nodeId;

    @Column(name = "node_type", nullable = false, length = 10)
    private String nodeType; // "ODC", "ODP", "OLT"

    @Column(name = "port_number", nullable = false)
    private Integer portNumber;

    @Column(nullable = false, length = 5)
    private String direction; // "IN" (upstream) or "OUT" (downstream)

    @Column(nullable = false, length = 20)
    private String status = "AVAILABLE"; // AVAILABLE, USED, RESERVED, BROKEN

    private String label;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "connected_core_id")
    private FiberCore connectedCore;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
