package com.company.ftthgis.domain.tenant.entity;

import com.company.ftthgis.domain.common.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenant_siem_endpoints")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Audited
public class TenantSiemEndpoint extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "target_url", nullable = false, length = 1024)
    private String targetUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_format", nullable = false, length = 32)
    @Builder.Default
    private SiemTargetFormat targetFormat = SiemTargetFormat.GENERIC_JSON;

    @Column(name = "signing_secret_encrypted", nullable = false, columnDefinition = "TEXT")
    private String signingSecretEncrypted;

    @Column(name = "signing_secret_prefix", nullable = false, length = 32)
    private String signingSecretPrefix;

    @Column(name = "custom_auth_header_name", length = 64)
    private String customAuthHeaderName;

    @Column(name = "custom_auth_header_encrypted", columnDefinition = "TEXT")
    private String customAuthHeaderEncrypted;

    @Column(name = "event_categories", nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String eventCategories = "AUTH,SSO,SCIM,SECURITY,ADMIN";

    @Column(name = "min_severity", nullable = false, length = 16)
    @Builder.Default
    private String minSeverity = "WARNING";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "consecutive_failures", nullable = false)
    @Builder.Default
    private int consecutiveFailures = 0;

    @Column(name = "auto_disabled_at")
    private OffsetDateTime autoDisabledAt;

    @Column(name = "auto_disabled_reason", length = 512)
    private String autoDisabledReason;

    @Column(name = "last_delivery_at")
    private OffsetDateTime lastDeliveryAt;

    @Column(name = "last_delivery_status", length = 24)
    private String lastDeliveryStatus;

    @Column(name = "last_http_status")
    private Integer lastHttpStatus;
}
