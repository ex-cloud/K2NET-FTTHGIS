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
 * Entitas domain terverifikasi milik organisasi tenant untuk Home Realm Discovery (HRD) SSO.
 *
 * <p>Sesuai ADR-0023, tabel ini menjadi Single Source of Truth (SSOT) bagi routing domain SSO.
 * Hanya baris berstatus {@code VERIFIED} yang ikut dalam HRD, dan Partial Unique Index global
 * pada PostgreSQL menjamin satu domain hanya dapat diverifikasi oleh satu organisasi secara atomik.
 */
@Entity
@Table(name = "organization_verified_domains", uniqueConstraints = {
        @UniqueConstraint(name = "uq_org_verified_domains_org_domain", columnNames = {"organization_id", "domain"})
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
public class OrganizationVerifiedDomain extends OrganizationAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "domain", nullable = false, length = 255)
    private String domain;

    @Column(name = "verification_token", nullable = false, length = 128)
    private String verificationToken;

    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "last_checked_at")
    private LocalDateTime lastCheckedAt;

    @Column(name = "last_error_message", columnDefinition = "TEXT")
    private String lastErrorMessage;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Long version = 0L;
}
