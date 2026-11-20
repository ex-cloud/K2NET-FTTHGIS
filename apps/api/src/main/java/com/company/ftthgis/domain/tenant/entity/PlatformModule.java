package com.company.ftthgis.domain.tenant.entity;

import com.company.ftthgis.domain.common.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.envers.Audited;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

/**
 * <h1>PlatformModule Entity (Enterprise Module Registry)</h1>
 * <p>
 * Single Source of Truth (SSOT) untuk seluruh modul fungsional di platform K2NET FTTH GIS
 * (baik berscope SYSTEM maupun TENANT) sesuai ADR-0018.
 * </p>
 */
@Entity
@Table(name = "platform_modules")
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@Audited
public class PlatformModule extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "module_key", nullable = false, unique = true, length = 64)
    private String moduleKey;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20)
    private String scope; // SYSTEM or TENANT

    @Column(nullable = false, length = 64)
    private String category; // NETWORK_GIS, OPERATIONS_OLT, SECURITY_GOV, BILLING_COMMERCIAL, PLATFORM_INFRA

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, IN_DEVELOPMENT, MAINTENANCE, DEPRECATED

    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private boolean isEnabled = true;

    @Column(name = "min_plan_tier", nullable = false, length = 32)
    @Builder.Default
    private String minPlanTier = "FREE"; // FREE, STARTER, PRO, ENTERPRISE

    @Column(name = "license_flag", length = 64)
    private String licenseFlag; // e.g. sso, api, ai_copilot, custom_domain

    @Column(name = "service_target", nullable = false, length = 100)
    @Builder.Default
    private String serviceTarget = "backend:9090";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata_json", columnDefinition = "jsonb")
    @Builder.Default
    private String metadataJson = "{}";
}
