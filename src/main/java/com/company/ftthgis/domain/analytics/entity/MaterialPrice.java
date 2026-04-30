package com.company.ftthgis.domain.analytics.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "material_prices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaterialPrice {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String materialName; // e.g., "Kabel Feeder 24 Core", "ODP 8 Port"

    @Column(nullable = false)
    private String category; // e.g., "CABLE", "NODE", "SERVICE"

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private String unit; // e.g., "METER", "UNIT", "LOT"

    private String description;
}
