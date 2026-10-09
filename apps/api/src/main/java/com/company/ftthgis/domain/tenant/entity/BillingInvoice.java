package com.company.ftthgis.domain.tenant.entity;

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
 * Entitas faktur penagihan & histori transaksi komersial (Dimensi Finansial).
 *
 * <p>Menghubungkan invoice Xendit VA/QRIS, kontrak enterprise PO, dan integrasi webhook callback.
 */
@Entity
@Table(name = "billing_invoices")
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@Audited
public class BillingInvoice extends OrganizationAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "license_id")
    private TenantLicense license;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 64)
    private String invoiceNumber;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Builder.Default
    @Column(nullable = false, length = 3)
    private String currency = "IDR";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private InvoiceStatus status = InvoiceStatus.PENDING;

    @Column(name = "due_date", nullable = false)
    private LocalDateTime dueDate;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "payment_method", length = 32)
    private String paymentMethod; // XENDIT_VA, XENDIT_QRIS, MANUAL_TRANSFER, ENTERPRISE_PO

    @Column(name = "payment_channel", length = 64)
    private String paymentChannel; // BCA, MANDIRI, BRI, BNI, QRIS

    @Column(name = "external_invoice_url", columnDefinition = "TEXT")
    private String externalInvoiceUrl;

    @Column(name = "external_reference_id", length = 128)
    private String externalReferenceId;

    // ── Helper Domain Logic Methods ─────────────────────────────────────────

    public boolean isPaid() {
        return status == InvoiceStatus.PAID && paidAt != null;
    }

    public boolean isOverdue() {
        return (status == InvoiceStatus.OVERDUE) ||
                (status == InvoiceStatus.PENDING && dueDate != null && dueDate.isBefore(LocalDateTime.now()));
    }
}
