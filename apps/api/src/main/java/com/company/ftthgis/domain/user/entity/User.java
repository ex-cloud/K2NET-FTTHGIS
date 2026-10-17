package com.company.ftthgis.domain.user.entity;

import com.company.ftthgis.domain.tenant.entity.OrganizationAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Audited
@EqualsAndHashCode(callSuper = true)
public class User extends OrganizationAwareEntity {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "secondary_email")
    private String secondaryEmail;

    @Column(unique = true)
    private String username;

    private String fullName;

    @Column(name = "phone", length = 64)
    private String phone;

    @Column(name = "job_title", length = 100)
    private String jobTitle;

    @Column(name = "last_login_at")
    private java.time.LocalDateTime lastLoginAt;

    @Column(name = "last_login_ip", length = 45)
    private String lastLoginIp;

    @Builder.Default
    @Column(name = "mfa_enabled", nullable = false)
    private boolean mfaEnabled = false;

    @Builder.Default
    @Column(name = "timezone", length = 50)
    private String timezone = "Asia/Jakarta";

    @Builder.Default
    @Column(name = "locale", length = 10)
    private String locale = "id";

    @Column(length = 1000)
    private String avatarUrl;

    @Builder.Default
    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, SUSPENDED

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.Set<com.company.ftthgis.domain.tenant.entity.ProjectMember> projectMembers = new java.util.HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.envers.NotAudited
    private java.util.Set<UserDevice> userDevices = new java.util.HashSet<>();

}
