package com.company.ftthgis.domain.tenant.entity;

import com.company.ftthgis.domain.common.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.envers.Audited;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Entitas master katalog paket add-on platform K2NET FTTH GIS (Dimensi Sistem / Control Plane).
 *
 * <p>Mencakup 12 kategori modul modular telco & enterprise, validasi prasyarat dependensi,
 * integrasi penagihan bulanan/one-time, serta penambahan kuota booster dinamis.
 */
@Entity
@Table(name = "platform_packages")
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@Audited
public class PlatformPackage extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 64)
    private PackageCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_type", nullable = false, length = 32)
    @Builder.Default
    private PackageBillingType billingType = PackageBillingType.RECURRING_MONTHLY;

    @Column(name = "price_monthly", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal priceMonthly = BigDecimal.ZERO;

    @Column(name = "min_plan_tier", nullable = false, length = 32)
    @Builder.Default
    private String minPlanTier = "FREE";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "prerequisite_codes", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private String prerequisiteCodes = "[]";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "conflict_codes", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private String conflictCodes = "[]";

    @Column(name = "feature_key", length = 128)
    private String featureKey;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "quota_delta_json", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private String quotaDeltaJson = "{}";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata_json", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private String metadataJson = "{}";

    @Column(name = "is_published", nullable = false)
    @Builder.Default
    private boolean isPublished = true;

    @Column(name = "icon_name", length = 64)
    @Builder.Default
    private String iconName = "Package";

    @Column(name = "badge_label", length = 64)
    private String badgeLabel;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    // ── Helper Domain Logic Methods ─────────────────────────────────────────

    public boolean isCapacityBooster() {
        return category == PackageCategory.CAPACITY_BOOSTER;
    }

    public boolean isOneTime() {
        return billingType == PackageBillingType.ONE_TIME;
    }
}
