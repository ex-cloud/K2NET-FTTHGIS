package com.company.ftthgis.domain.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Audited
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name; // e.g., "FREE", "BASIC", "ENTERPRISE"

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "max_projects")
    private Integer maxProjects;

    @Column(name = "max_odcs")
    private Integer maxOdcs;

    @Column(name = "max_odps")
    private Integer maxOdps;

    @Column(name = "max_customers")
    private Integer maxCustomers;

    @Builder.Default
    @Column(name = "has_sso")
    private boolean hasSso = false;

    @Builder.Default
    @Column(name = "has_api_access")
    private boolean hasApiAccess = false;
}
