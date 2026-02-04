package com.company.ftthgis.domain.network.entity;

import com.company.ftthgis.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Entity
@Table(name = "asset_categories")
@Getter
@Setter
@Audited
public class AssetCategory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(unique = true)
    private String slug;

    private String icon;

    private String description;
}
