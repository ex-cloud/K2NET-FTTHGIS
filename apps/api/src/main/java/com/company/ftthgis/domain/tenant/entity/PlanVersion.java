package com.company.ftthgis.domain.tenant.entity;

import com.company.ftthgis.domain.common.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.envers.Audited;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entitas versi paket langganan komersial platform (Domain Catalog).
 *
 * <p>Versi paket bersifat immutable setelah dipublikasikan (Published).
 * Perubahan fitur, kuota, atau harga wajib menghasilkan entitas versi baru.
 */
@Entity
@Table(name = "plan_versions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_plan_versions_plan_version", columnNames = {"plan_id", "version"})
})
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@Audited
public class PlanVersion extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("planId")
    public UUID getPlanId() {
        return plan != null ? plan.getId() : null;
    }

    @Column(name = "version", nullable = false, length = 32)
    private String version; // e.g. "v1.0.0"

    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private String status = "ACTIVE"; // DRAFT, ACTIVE, ARCHIVED

    @Column(name = "price_monthly", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal priceMonthly = BigDecimal.ZERO;

    @Column(name = "price_yearly", precision = 15, scale = 2)
    private BigDecimal priceYearly;

    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "IDR";

    // ── Baseline Quotas ─────────────────────────────────────────────────────

    @Column(name = "max_projects", nullable = false)
    @Builder.Default
    private Integer maxProjects = 1;

    @Column(name = "max_archived_projects", nullable = false)
    @Builder.Default
    private Integer maxArchivedProjects = 1;

    @Column(name = "max_olts", nullable = false)
    @Builder.Default
    private Integer maxOlts = 1;

    @Column(name = "max_odcs")
    private Integer maxOdcs;

    @Column(name = "max_odps")
    private Integer maxOdps;

    @Column(name = "max_customers")
    private Integer maxCustomers;

    @Column(name = "max_storage_gb", nullable = false)
    @Builder.Default
    private Integer maxStorageGb = 2;

    @Column(name = "api_rate_limit_rpm", nullable = false)
    @Builder.Default
    private Integer apiRateLimitRpm = 500;

    // ── Feature Entitlements ────────────────────────────────────────────────

    @Column(name = "has_sso", nullable = false)
    @Builder.Default
    private boolean hasSso = false;

    @Column(name = "has_api_access", nullable = false)
    @Builder.Default
    private boolean hasApiAccess = false;

    @Column(name = "has_ai_copilot", nullable = false)
    @Builder.Default
    private boolean hasAiCopilot = false;

    @Column(name = "has_custom_domain", nullable = false)
    @Builder.Default
    private boolean hasCustomDomain = false;

    // ── Operational Policies ────────────────────────────────────────────────

    @Column(name = "grace_days", nullable = false)
    @Builder.Default
    private Integer graceDays = 14;

    @Column(name = "readonly_days", nullable = false)
    @Builder.Default
    private Integer readonlyDays = 14;

    // ── Version Lifecycle ───────────────────────────────────────────────────

    @Column(name = "effective_from", nullable = false)
    @Builder.Default
    private LocalDateTime effectiveFrom = LocalDateTime.now();

    @Column(name = "effective_to")
    private LocalDateTime effectiveTo;

    @Column(name = "published_by", length = 64)
    @Builder.Default
    private String publishedBy = "SYSTEM";

    @Column(name = "changelog", columnDefinition = "TEXT")
    private String changelog;
}
