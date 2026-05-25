package com.company.ftthgis.domain.common;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

@Entity
@Table(name = "system_settings")
@jakarta.persistence.Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class SystemSetting extends AuditableEntity {

    @Id
    @Column(name = "config_key", nullable = false, unique = true)
    private String key;

    @Column(name = "config_value", columnDefinition = "TEXT")
    private String value;

    @Column(nullable = false)
    private String category; // e.g. "GENERAL", "SMTP", "SECURITY", "GIS", "BRANDING"

    @Column(columnDefinition = "TEXT")
    private String description;
}
