package com.company.ftthgis.domain.common;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "github_app_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class GithubAppConfig extends AuditableEntity {

    @Id
    @Column(name = "config_key", nullable = false, unique = true)
    private String key;

    @Column(name = "config_value", columnDefinition = "TEXT")
    private String value;

    @Column(nullable = false)
    private String category; // e.g. "GITHUB_APP"

    @Column(columnDefinition = "TEXT")
    private String description;
}
