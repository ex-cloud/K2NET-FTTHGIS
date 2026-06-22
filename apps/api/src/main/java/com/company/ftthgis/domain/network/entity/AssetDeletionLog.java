package com.company.ftthgis.domain.network.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "asset_deletion_log")
@Data
public class AssetDeletionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String assetCode;

    @Column(nullable = false)
    private String assetType; // ODP, ODC, OLT, CABLE

    @Column(nullable = false, length = 500)
    private String reason;

    private String deletedBy; // username from JWT if available

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime deletedAt;
}
