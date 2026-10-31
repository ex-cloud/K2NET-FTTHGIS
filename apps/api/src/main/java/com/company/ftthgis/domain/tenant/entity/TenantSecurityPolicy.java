package com.company.ftthgis.domain.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.envers.Audited;

import java.util.UUID;

@Entity
@Table(name = "tenant_security_policies")
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@Audited
public class TenantSecurityPolicy extends OrganizationAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "mfa_enforced", nullable = false)
    @Builder.Default
    private boolean mfaEnforced = false;

    @Column(name = "allowed_methods", nullable = false, length = 255)
    @Builder.Default
    private String allowedMethods = "totp,webauthn";

    @Column(name = "grace_period_days", nullable = false)
    @Builder.Default
    private int gracePeriodDays = 7;

    @Column(name = "session_idle_minutes", nullable = false)
    @Builder.Default
    private int sessionIdleMinutes = 30;

    @Column(name = "device_verification_required", nullable = false)
    @Builder.Default
    private boolean deviceVerificationRequired = false;

    @Column(name = "ip_allowlist_cidrs", columnDefinition = "TEXT")
    private String ipAllowlistCidrs;
}

