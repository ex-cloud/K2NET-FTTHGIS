package com.company.ftthgis.domain.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.envers.Audited;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entitas konfigurasi federasi identitas SSO (Single Sign-On) organisasi tenant.
 *
 * <p>Mendukung protokol SAML 2.0 dan OpenID Connect (OIDC) untuk integrasi dengan:
 * <ul>
 *   <li>Google Workspace (OIDC)</li>
 *   <li>Microsoft Entra ID / Azure AD (OIDC / SAML 2.0)</li>
 *   <li>Okta Identity Cloud (OIDC / SAML 2.0)</li>
 *   <li>Custom Enterprise SAML 2.0 / OIDC Identity Provider</li>
 * </ul>
 *
 * Rahasia kredensial (client_secret) wajib disimpan dalam bentuk terenkripsi AES-256 GCM
 * menggunakan {@link com.company.ftthgis.service.LicenseCryptoService}.
 */
@Entity
@Table(name = "organization_sso_configs", uniqueConstraints = {
        @UniqueConstraint(name = "uq_org_sso_config_provider", columnNames = {"organization_id", "provider_type"})
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
public class OrganizationSsoConfig extends OrganizationAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "provider_type", nullable = false, length = 32)
    @Builder.Default
    private String providerType = "OIDC_CUSTOM";

    @Column(name = "display_name", length = 128)
    private String displayName;

    @Column(name = "issuer_url", length = 512)
    private String issuerUrl;

    @Column(name = "client_id", nullable = false, length = 256)
    private String clientId;

    @Column(name = "client_secret_encrypted", columnDefinition = "TEXT")
    private String clientSecretEncrypted;

    @Column(name = "metadata_url", length = 512)
    private String metadataUrl;

    @Column(name = "entity_id", length = 256)
    private String entityId;

    @Column(name = "single_sign_on_url", length = 512)
    private String singleSignOnUrl;

    @Column(name = "signing_certificate", columnDefinition = "TEXT")
    private String signingCertificate;

    @Column(name = "secondary_signing_certificate", columnDefinition = "TEXT")
    private String secondarySigningCertificate;

    @Column(name = "enforce_sso", nullable = false)
    @Builder.Default
    private boolean enforceSso = false;

    @Column(name = "allow_break_glass_bypass", nullable = false)
    @Builder.Default
    private boolean allowBreakGlassBypass = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "domain_mappings", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private String domainMappings = "[]";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attribute_mapping", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private String attributeMapping = "{}";

    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private String status = "INACTIVE";

    @Column(name = "last_test_at")
    private LocalDateTime lastTestAt;

    @Column(name = "last_test_status", length = 32)
    private String lastTestStatus;

    @Column(name = "last_test_error_message", columnDefinition = "TEXT")
    private String lastTestErrorMessage;

    @Column(name = "health_status", nullable = false, length = 32)
    @Builder.Default
    private String healthStatus = "UNKNOWN";

    @Column(name = "last_health_check_at")
    private LocalDateTime lastHealthCheckAt;

    @Column(name = "last_health_latency_ms")
    private Integer lastHealthLatencyMs;

    @Column(name = "consecutive_probe_failures", nullable = false)
    @Builder.Default
    private Integer consecutiveProbeFailures = 0;

    @Column(name = "last_health_error", columnDefinition = "TEXT")
    private String lastHealthError;

    @Column(name = "tls_cert_expires_at")
    private LocalDateTime tlsCertExpiresAt;

    @Column(name = "tls_cert_subject", length = 255)
    private String tlsCertSubject;

    @Column(name = "saml_cert_expires_at")
    private LocalDateTime samlCertExpiresAt;

    @Column(name = "saml_cert_subject", length = 255)
    private String samlCertSubject;

    @Column(name = "saml_cert_fingerprint", length = 95)
    private String samlCertFingerprint;

    @Column(name = "secondary_saml_cert_expires_at")
    private LocalDateTime secondarySamlCertExpiresAt;

    @Column(name = "secondary_saml_cert_subject", length = 255)
    private String secondarySamlCertSubject;

    @Column(name = "secondary_saml_cert_fingerprint", length = 95)
    private String secondarySamlCertFingerprint;

    @Column(name = "saml_cert_overlap_started_at")
    private LocalDateTime samlCertOverlapStartedAt;

    @Column(name = "saml_cert_rotated_at")
    private LocalDateTime samlCertRotatedAt;

    @Column(name = "client_secret_expires_at")
    private LocalDateTime clientSecretExpiresAt;

    @Column(name = "last_alert_sent_at")
    private LocalDateTime lastAlertSentAt;

    @Column(name = "last_alert_stage", length = 32)
    private String lastAlertStage;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Long version = 0L;
}

