package com.company.ftthgis.domain.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

import java.util.UUID;

@Entity
@Table(name = "organization_configs")
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Audited
@EqualsAndHashCode(callSuper = true)
public class OrganizationConfig extends OrganizationAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "config_key", nullable = false)
    private String configKey; // e.g., "snmp_poller_url", "keycloak_realm"

    @Column(name = "config_value", columnDefinition = "TEXT")
    private String configValue;

    @Builder.Default
    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "description")
    private String description;
}
