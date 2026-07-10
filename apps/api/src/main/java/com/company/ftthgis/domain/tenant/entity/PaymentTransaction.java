package com.company.ftthgis.domain.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "external_id", nullable = false, unique = true)
    private String externalId;

    @Column(name = "org_slug", nullable = false)
    private String orgSlug;

    @Column(name = "plan_name", nullable = false)
    private String planName;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String status; // PENDING, PAID, FAILED

    @Column(name = "payer_email")
    private String payerEmail;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
