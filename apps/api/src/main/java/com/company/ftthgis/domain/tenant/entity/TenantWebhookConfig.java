package com.company.ftthgis.domain.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "tenant_webhook_configs")
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class TenantWebhookConfig extends OrganizationAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "api_key_hash", nullable = false, unique = true, length = 64)
    private String apiKeyHash;

    @Column(name = "api_key_prefix", nullable = false, length = 32)
    private String apiKeyPrefix;

    @Column(name = "api_key_last4", nullable = false, length = 8)
    private String apiKeyLast4;

    @Column(name = "webhook_url", length = 512)
    private String webhookUrl;

    @Column(name = "webhook_secret_encrypted", length = 512)
    private String webhookSecretEncrypted;

    @Builder.Default
    @Column(name = "rate_limit_per_minute", nullable = false)
    private Integer rateLimitPerMinute = 5000;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "subscribed_events", columnDefinition = "jsonb")
    private String subscribedEvents;
}
