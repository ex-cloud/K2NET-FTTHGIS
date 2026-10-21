package com.company.ftthgis.domain.tenant.entity;

import com.company.ftthgis.domain.common.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entitas konfigurasi kebijakan penagihan platform (Domain Catalog).
 *
 * <p>Menyimpan aturan tenggang waktu (Grace Days), masa Read-Only, jadwal pengiriman reminder,
 * serta zona waktu transaksi platform (Asia/Jakarta).
 */
@Entity
@Table(name = "billing_policies")
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@Audited
public class BillingPolicy extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "policy_key", nullable = false, unique = true, length = 64)
    private String policyKey;

    @Column(name = "policy_value", nullable = false, columnDefinition = "TEXT")
    private String policyValue;

    @Column(name = "value_type", nullable = false, length = 32)
    @Builder.Default
    private String valueType = "STRING"; // STRING, INTEGER, DECIMAL, BOOLEAN, JSON

    @Column(name = "category", nullable = false, length = 64)
    @Builder.Default
    private String category = "BILLING"; // BILLING, DUNNING, NOTIFICATION, REGULATORY

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(name = "effective_from", nullable = false)
    @Builder.Default
    private LocalDateTime effectiveFrom = LocalDateTime.now();
}
