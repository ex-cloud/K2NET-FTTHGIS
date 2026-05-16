package com.company.ftthgis.domain.user.entity;

import com.company.ftthgis.domain.common.AuditableEntity;
import com.company.ftthgis.domain.tenant.entity.Organization;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "roles", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"name", "organization_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Audited
public class Role extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // e.g., "super_admin", "admin", "technician"

    private String displayName;

    private String description;

    @Column(name = "is_system_role", nullable = false)
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonProperty("isSystemRole")
    private boolean isSystemRole = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    @JsonIgnore
    private Organization organization;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "role_permissions", joinColumns = @JoinColumn(name = "role_id"), inverseJoinColumns = @JoinColumn(name = "permission_id"))
    @Builder.Default
    private Set<Permission> permissions = new HashSet<>();

    @JsonIgnore
    @OneToMany(mappedBy = "role")
    @Builder.Default
    private Set<User> users = new HashSet<>();
}
