package com.company.ftthgis.domain.tenant.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;
import java.util.UUID;

@Entity
@Table(name = "organizations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode
@Audited
public class Organization {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private String address;

    @Column
    private String website;

    @Column
    private String logoUrl;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plan_id")
    private SubscriptionPlan subscriptionPlan;

    @jakarta.persistence.OneToMany(mappedBy = "organization", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true, fetch = jakarta.persistence.FetchType.EAGER)
    @org.hibernate.envers.NotAudited
    private java.util.List<OrganizationConfig> configs;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @jakarta.persistence.OneToMany(mappedBy = "organization", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.envers.NotAudited
    private java.util.List<Project> projects;

    // Status Management
    @Column(nullable = false)
    @jakarta.persistence.Enumerated(jakarta.persistence.EnumType.STRING)
    @lombok.Builder.Default
    private OrganizationStatus status = OrganizationStatus.ACTIVE;

    @Column(name = "trial_expires_at")
    private java.time.LocalDateTime trialExpiresAt;

    public enum OrganizationStatus {
        ACTIVE,
        SUSPENDED,
        TRIAL_EXPIRED,
        DELETED
    }

    @com.fasterxml.jackson.annotation.JsonProperty("settings")
    public java.util.Map<String, String> getSettingsMap() {
        if (configs == null) return new java.util.HashMap<>();
        java.util.Map<String, String> map = new java.util.HashMap<>();
        for (OrganizationConfig config : configs) {
            if (config.getConfigKey() == null) continue;
            
            String key = config.getConfigKey().toLowerCase();
            // SECURITY: Never expose passwords to the frontend
            if (key.contains("password")) {
                map.put(key, "********");
            } else {
                map.put(key, config.getConfigValue());
            }
        }
        return map;
    }
}
