package com.company.ftthgis.domain.tenant.entity;

import com.company.ftthgis.domain.common.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.envers.Audited;

import java.util.UUID;

/**
 * Entitas konfigurasi template pesan penagihan & pengingat lisensi (Domain Catalog).
 *
 * <p>Mendukung saluran multi-channel (EMAIL, WHATSAPP) dengan variabel dinamis:
 * <ul>
 *   <li>{tenant_name} — Nama tenant organisasi</li>
 *   <li>{plan_name} — Tier nama paket langganan</li>
 *   <li>{due_date} — Tanggal jatuh tempo penagihan</li>
 *   <li>{license_key} — Kunci lisensi Ed25519 aktif</li>
 *   <li>{invoice_amount} — Nominal tagihan faktur</li>
 *   <li>{invoice_number} — Nomor referensi faktur resmi</li>
 *   <li>{payment_link} — Tautan pembayaran instan</li>
 *   <li>{grace_days_remaining} — Sisa hari toleransi masa tenggang</li>
 * </ul>
 */
@Entity
@Table(name = "message_templates")
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@Audited
public class MessageTemplate extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "code", nullable = false, unique = true, length = 64)
    private String code;

    @Column(name = "name", nullable = false, length = 128)
    private String name;

    @Column(name = "channel", nullable = false, length = 32)
    @Builder.Default
    private String channel = "EMAIL"; // EMAIL, WHATSAPP, SMS, ALL

    @Column(name = "category", nullable = false, length = 64)
    @Builder.Default
    private String category = "DUNNING"; // DUNNING, BILLING, SYSTEM

    @Column(name = "subject_template")
    private String subjectTemplate;

    @Column(name = "body_template", nullable = false, columnDefinition = "TEXT")
    private String bodyTemplate;

    @Column(name = "variables_description", columnDefinition = "TEXT")
    private String variablesDescription;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
