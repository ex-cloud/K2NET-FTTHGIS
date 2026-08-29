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
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "organizations")
@jakarta.persistence.Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
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

    @org.hibernate.envers.NotAudited
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @org.hibernate.envers.NotAudited
    @Column(name = "deleted_by")
    private String deletedBy;

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

    @Column(name = "grace_period_until")
    private java.time.LocalDateTime gracePeriodUntil;

    @Column(name = "booster_odps")
    @lombok.Builder.Default
    private Integer boosterOdps = 0;

    @Column(name = "booster_olts")
    @lombok.Builder.Default
    private Integer boosterOlts = 0;

    @Column(name = "booster_expires_at")
    private java.time.LocalDateTime boosterExpiresAt;

    @Column(name = "dunning_level")
    @lombok.Builder.Default
    private Integer dunningLevel = 0;

    @Column(name = "plan_cycle")
    @lombok.Builder.Default
    private String planCycle = "MONTHLY";

    @Column(name = "over_quota_mode")
    @lombok.Builder.Default
    private Boolean overQuotaMode = false;

    public enum OrganizationStatus {
        ACTIVE,
        TRIAL,
        PENDING_APPROVAL,
        OVERDUE,
        OVER_QUOTA,
        SUSPENDED,
        TRIAL_EXPIRED,
        DELETED
    }

    public boolean isBoosterActive() {
        return boosterExpiresAt != null && boosterExpiresAt.isAfter(java.time.LocalDateTime.now());
    }

    public int getEffectiveMaxOlts(Integer baseOlts) {
        int base = baseOlts != null ? baseOlts : (subscriptionPlan != null && subscriptionPlan.getMaxProjects() != null ? subscriptionPlan.getMaxProjects() : 5);
        return base + (isBoosterActive() && boosterOlts != null ? boosterOlts : 0);
    }

    public int getEffectiveMaxOdps(Integer baseOdps) {
        int base = baseOdps != null ? baseOdps : (subscriptionPlan != null && subscriptionPlan.getMaxOdps() != null ? subscriptionPlan.getMaxOdps() : 1000);
        return base + (isBoosterActive() && boosterOdps != null ? boosterOdps : 0);
    }

    public boolean isTrialExpired() {
        return trialExpiresAt != null && trialExpiresAt.isBefore(java.time.LocalDateTime.now());
    }

    public boolean isSoftLocked() {
        if (dunningLevel != null && dunningLevel >= 3) return true;
        if (isTrialExpired()) {
            return gracePeriodUntil == null || gracePeriodUntil.isBefore(java.time.LocalDateTime.now());
        }
        return false;
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
