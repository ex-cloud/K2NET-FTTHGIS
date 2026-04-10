package com.company.ftthgis.domain.analytics.entity;

import lombok.*;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "network_event_history", indexes = {
        @Index(name = "idx_event_timestamp", columnList = "timestamp"),
        @Index(name = "idx_event_asset_code", columnList = "asset_code")
})
public class NetworkEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asset_code", nullable = false)
    private String assetCode;

    @Column(name = "asset_type", nullable = false)
    private String assetType; // OLT, ODC, ODP, CUSTOMER

    @Column(name = "old_status", nullable = false)
    private String oldStatus;

    @Column(name = "new_status", nullable = false)
    private String newStatus;

    // EVENT_TYPE: "STATUS_CHANGE", "SIMULATION", "RECOVERY", "MAINTENANCE"
    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "reason")
    private String reason;

    @Column(nullable = false)
    private LocalDateTime timestamp;
}
