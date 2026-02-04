package com.company.ftthgis.domain.user.entity;

import com.company.ftthgis.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "permissions")
@Getter
@Setter
@Audited
public class Permission extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code; // e.g., "nodes.view", "tickets.create"

    @Column(nullable = false)
    private String name; // Display name

    private String description;

    @Column(nullable = false)
    private String module; // e.g., "dashboard", "nodes", "tickets"

    @ManyToMany(mappedBy = "permissions")
    private Set<Role> roles = new HashSet<>();
}
