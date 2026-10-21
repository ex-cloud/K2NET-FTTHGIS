package com.company.ftthgis.domain.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entitas langganan resmi tenant ke versi paket komersial (Domain Billing).
 *
 * <p>Menerapkan aturan isolasi multi-tenant dengan constraint PostgreSQL partial unique:
 * maksimal 1 langganan berstatus aktif/grace/read-only per organisasi.
 * Mendukung penandaan {@code isTest} untuk mengeluarkan tenant uji E2E dari agregasi finansial (MRR, KPI).
 */
@Entity
@Table(name = "tenant_subscriptions")
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@Audited
public class TenantSubscription extends OrganizationAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_version_id", nullable = false)
    private PlanVersion planVersion;

    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, GRACE_PERIOD, RESTRICTED_READ_ONLY, SUSPENDED, CANCELLED, EXPIRED

    @Column(name = "billing_cycle", nullable = false, length = 16)
    @Builder.Default
    private String billingCycle = "MONTHLY"; // MONTHLY, YEARLY, LIFETIME

    @Column(name = "current_period_start", nullable = false)
    private LocalDateTime currentPeriodStart;

    @Column(name = "current_period_end", nullable = false)
    private LocalDateTime currentPeriodEnd;

    @Column(name = "grace_period_end")
    private LocalDateTime gracePeriodEnd;

    @Column(name = "next_invoice_at")
    private LocalDateTime nextInvoiceAt;

    @Column(name = "cancel_at")
    private LocalDateTime cancelAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    /**
     * Flag isolasi tenant uji E2E agar tidak mencemari metrik finansial platform (MRR, KPI).
     */
    @Column(name = "is_test", nullable = false)
    @Builder.Default
    private boolean test = false;

    // ── Kontak Penagihan Terverifikasi ──────────────────────────────────────

    @Column(name = "billing_contact_name", length = 128)
    private String billingContactName;

    @Column(name = "billing_contact_email")
    private String billingContactEmail;

    @Column(name = "billing_contact_phone", length = 64)
    private String billingContactPhone;

    // ── Custom Quota Overrides (Kontrak Enterprise Spesifik) ────────────────

    @Column(name = "override_max_projects")
    private Integer overrideMaxProjects;

    @Column(name = "override_max_archived_projects")
    private Integer overrideMaxArchivedProjects;

    @Column(name = "override_max_olts")
    private Integer overrideMaxOlts;

    @Column(name = "override_max_odcs")
    private Integer overrideMaxOdcs;

    @Column(name = "override_max_odps")
    private Integer overrideMaxOdps;

    @Column(name = "override_max_customers")
    private Integer overrideMaxCustomers;

    @Column(name = "override_max_storage_gb")
    private Integer overrideMaxStorageGb;

    @Column(name = "override_api_rate_limit_rpm")
    private Integer overrideApiRateLimitRpm;

    // ── Feature Entitlements Flags ──────────────────────────────────────────

    @Column(name = "feature_sso_enabled", nullable = false)
    @Builder.Default
    private boolean featureSsoEnabled = false;

    @Column(name = "feature_api_enabled", nullable = false)
    @Builder.Default
    private boolean featureApiEnabled = false;

    @Column(name = "feature_ai_copilot_enabled", nullable = false)
    @Builder.Default
    private boolean featureAiCopilotEnabled = false;

    @Column(name = "feature_custom_domain_enabled", nullable = false)
    @Builder.Default
    private boolean featureCustomDomainEnabled = false;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // ── Helper Domain Logic Methods ─────────────────────────────────────────

    public boolean isActive() {
        return "ACTIVE".equalsIgnoreCase(status) && !isExpired();
    }

    public boolean isExpired() {
        return currentPeriodEnd != null && currentPeriodEnd.isBefore(LocalDateTime.now());
    }

    public boolean isGracePeriodActive() {
        if ("GRACE_PERIOD".equalsIgnoreCase(status)) {
            return gracePeriodEnd == null || gracePeriodEnd.isAfter(LocalDateTime.now());
        }
        return false;
    }

    public boolean isReadOnly() {
        return "RESTRICTED_READ_ONLY".equalsIgnoreCase(status);
    }
}
