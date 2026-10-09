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
 * Entitas lisensi resmi organisasi tenant (Dimensi Otorisasi Teknis Runtime).
 *
 * <p>Mendukung validasi token kriptografis berformat {@code K2NET-{TIER}-{RANDOM_HEX}-{SIGNATURE_CHECKSUM}},
 * pembatasan runtime AOP (Read-Only Guard), custom quota override, serta deployment cloud dan offline (air-gapped).
 */
@Entity
@Table(name = "tenant_licenses")
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@Audited
public class TenantLicense extends OrganizationAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_plan_id", nullable = false)
    private SubscriptionPlan subscriptionPlan;

    @Column(name = "license_key", nullable = false, unique = true, length = 64)
    private String licenseKey;

    @Column(name = "license_signature", nullable = false, columnDefinition = "TEXT")
    private String licenseSignature;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private LicenseStatus status = LicenseStatus.ACTIVE;

    @Column(name = "activation_type", nullable = false, length = 16)
    @Builder.Default
    private String activationType = "ONLINE"; // ONLINE, OFFLINE_KEY, ENTERPRISE_PO

    @Column(name = "valid_from", nullable = false)
    private LocalDateTime validFrom;

    @Column(name = "valid_until", nullable = false)
    private LocalDateTime validUntil;

    @Column(name = "grace_period_until")
    private LocalDateTime gracePeriodUntil;

    // ── Custom Quota Overrides (Kontrak Enterprise Khusus) ──────────────────

    @Column(name = "override_max_projects")
    private Integer overrideMaxProjects;

    @Column(name = "override_max_odps")
    private Integer overrideMaxOdps;

    @Column(name = "override_max_odcs")
    private Integer overrideMaxOdcs;

    @Column(name = "override_max_customers")
    private Integer overrideMaxCustomers;

    @Column(name = "override_max_storage_gb")
    private Integer overrideMaxStorageGb;

    // ── Feature Entitlements Flags ──────────────────────────────────────────

    @Builder.Default
    @Column(name = "feature_sso_enabled", nullable = false)
    private boolean featureSsoEnabled = false;

    @Builder.Default
    @Column(name = "feature_api_enabled", nullable = false)
    private boolean featureApiEnabled = false;

    @Builder.Default
    @Column(name = "feature_ai_copilot_enabled", nullable = false)
    private boolean featureAiCopilotEnabled = false;

    @Builder.Default
    @Column(name = "feature_custom_domain_enabled", nullable = false)
    private boolean featureCustomDomainEnabled = false;

    // ── Hardware Binding (Air-Gapped On-Premise) ────────────────────────────

    @Column(name = "machine_fingerprint", length = 128)
    private String machineFingerprint;

    @Builder.Default
    @Column(name = "issued_by", nullable = false, length = 64)
    private String issuedBy = "SYSTEM_BILLING";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // ── Notification Lifecycle & Proactive Reminder Tracking ────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "last_notified_stage", nullable = false, length = 32)
    @Builder.Default
    private LicenseNotificationStage lastNotifiedStage = LicenseNotificationStage.NONE;

    @Column(name = "last_notified_at")
    private LocalDateTime lastNotifiedAt;

    @Column(name = "billing_contact_email")
    private String billingContactEmail;

    @Column(name = "billing_contact_phone", length = 64)
    private String billingContactPhone;

    @Column(name = "billing_contact_name", length = 128)
    private String billingContactName;

    @Builder.Default
    @Column(name = "notify_email_enabled", nullable = false)
    private boolean notifyEmailEnabled = true;

    @Builder.Default
    @Column(name = "notify_whatsapp_enabled", nullable = false)
    private boolean notifyWhatsappEnabled = true;

    // ── Helper Domain Logic Methods ─────────────────────────────────────────

    public boolean isActive() {
        return status == LicenseStatus.ACTIVE && !isExpired();
    }

    public boolean isExpired() {
        return validUntil != null && validUntil.isBefore(LocalDateTime.now());
    }

    public boolean isGracePeriodActive() {
        if (status == LicenseStatus.GRACE_PERIOD) {
            return gracePeriodUntil == null || gracePeriodUntil.isAfter(LocalDateTime.now());
        }
        return false;
    }

    public boolean isReadOnly() {
        return status == LicenseStatus.RESTRICTED_READ_ONLY;
    }

    public boolean isSuspendedOrRevoked() {
        return status == LicenseStatus.SUSPENDED || status == LicenseStatus.REVOKED;
    }
}
