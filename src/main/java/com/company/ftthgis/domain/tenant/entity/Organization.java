package com.company.ftthgis.domain.tenant.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.util.UUID;

@Entity
@Table(name = "organizations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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

    @com.fasterxml.jackson.annotation.JsonIgnore
    @jakarta.persistence.OneToMany(mappedBy = "organization", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private java.util.List<Project> projects;
}
