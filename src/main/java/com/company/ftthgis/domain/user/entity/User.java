package com.company.ftthgis.domain.user.entity;

import com.company.ftthgis.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Entity
@Table(name = "users")
@Getter
@Setter
@Audited
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    // Password removed for security (managed by Keycloak)

    private String fullName;

    @Column(length = 1000)
    private String avatarUrl;

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, SUSPENDED

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    // Keycloak Subject ID (for SSO linking)
    @Column(unique = true)
    private String keycloakSubject;
}
