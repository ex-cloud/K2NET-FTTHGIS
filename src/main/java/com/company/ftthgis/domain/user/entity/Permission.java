package com.company.ftthgis.domain.user.entity;

import com.company.ftthgis.domain.common.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.ManyToMany;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
    private String code; 

    @Column(nullable = false)
    private String name; 

    private String description;

    @Column(nullable = false)
    private String module; 

    @JsonIgnore
    @ManyToMany(mappedBy = "permissions")
    private Set<Role> roles = new HashSet<>();
}
