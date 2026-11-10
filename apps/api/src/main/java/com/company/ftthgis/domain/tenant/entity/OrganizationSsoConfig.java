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

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Long version = 0L;
}

