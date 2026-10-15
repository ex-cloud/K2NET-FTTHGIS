package com.company.ftthgis.domain.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenant_branding")
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@Audited
public class TenantBranding extends OrganizationAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "custom_domain", unique = true, length = 255)
    private String customDomain;

    @Column(name = "domain_status", nullable = false, length = 32)
    @Builder.Default
    private String domainStatus = "PENDING_DNS"; // PENDING_DNS, ACTIVE, FAILED

    @Column(name = "cname_target", nullable = false, length = 255)
    @Builder.Default
    private String cnameTarget = "edge.kdua.net";

    @Column(name = "verification_token", nullable = false, length = 64)
    private String verificationToken;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "ssl_status", nullable = false, length = 32)
    @Builder.Default
    private String sslStatus = "PENDING"; // PENDING, ISSUED, FAILED

    @Column(name = "ssl_issued_at")
    private LocalDateTime sslIssuedAt;

    @Column(name = "app_title", length = 128)
    private String appTitle;

    @Column(name = "company_name", length = 128)
    private String companyName;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(name = "favicon_url", columnDefinition = "TEXT")
    private String faviconUrl;

    @Column(name = "brand_color_primary", length = 32)
    @Builder.Default
    private String brandColorPrimary = "#2563EB";

    @Column(name = "brand_color_accent", length = 32)
    @Builder.Default
    private String brandColorAccent = "#1D4ED8";

    @Column(name = "footer_text", length = 255)
    private String footerText;

    @Column(name = "support_email", length = 255)
    private String supportEmail;

    @Column(name = "support_phone", length = 64)
    private String supportPhone;
}
