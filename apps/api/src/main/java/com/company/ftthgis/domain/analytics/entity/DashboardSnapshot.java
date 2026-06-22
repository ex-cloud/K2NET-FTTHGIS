package com.company.ftthgis.domain.analytics.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;


/**
 * Stores periodic snapshots of dashboard metrics so the frontend
 * can display historical trends and allow date-range filtering.
 * The backend scheduler writes one row every 5 minutes.
 */
@Entity
@Table(name = "dashboard_snapshots", indexes = {
        @Index(name = "idx_snapshot_recorded_at", columnList = "recordedAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime recordedAt;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    private long totalNodes;
    private long activeNodes;
    private long downNodes;
    private double networkUptime;
    private long customerReach;
    private double totalNetworkLengthKm;
}
