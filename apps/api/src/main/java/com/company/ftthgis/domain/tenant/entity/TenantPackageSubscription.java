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
 * Entitas langganan paket add-on tenant organisasi (Dimensi Operasional Tenant / Application Plane).
 *
 * <p>Menghubungkan instansiasi paket platform dengan organisasi tenant, pelacakan masa berlaku,
 * renewal otomatis, serta keterikatan faktur penagihan Xendit.
 */
@Entity
@Table(name = "tenant_package_subscriptions")
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@Audited
public class TenantPackageSubscription extends OrganizationAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = false)
    private PlatformPackage platformPackage;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private PackageSubscriptionStatus status = PackageSubscriptionStatus.ACTIVE;

    @Column(name = "granted_by", nullable = false, length = 64)
    @Builder.Default
    private String grantedBy = "PAYMENT_GATEWAY"; // PAYMENT_GATEWAY, ADMIN_MANUAL

    @Column(name = "grant_notes", columnDefinition = "TEXT")
    private String grantNotes;

    @Column(name = "activated_at", nullable = false)
    private LocalDateTime activatedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt; // Nullable untuk paket ONE_TIME permanen

    @Column(name = "auto_renew", nullable = false)
    @Builder.Default
    private boolean autoRenew = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_invoice_id")
    private BillingInvoice lastInvoice;

    // ── Helper Domain Logic Methods ─────────────────────────────────────────

    public boolean isActive() {
        if (status != PackageSubscriptionStatus.ACTIVE) {
            return false;
        }
        return expiresAt == null || expiresAt.isAfter(LocalDateTime.now());
    }

    public boolean isExpired() {
        if (status == PackageSubscriptionStatus.EXPIRED) {
            return true;
        }
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }
}
