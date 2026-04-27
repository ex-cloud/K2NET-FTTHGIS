package com.company.ftthgis.domain.user.entity;

import com.company.ftthgis.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@Audited
public class User extends BaseEntity {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(unique = true)
    private String username;

    // Password removed for security (managed by Keycloak)

    private String fullName;

    @Column(length = 1000)
    private String avatarUrl;

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, SUSPENDED

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

}
