package com.company.ftthgis.domain.tenant.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

@MappedSuperclass
@Getter
@Setter
@FilterDef(name = "tenantFilter", parameters = {@ParamDef(name = "projectId", type = String.class)})
@Filter(name = "tenantFilter", condition = "project_id = :projectId")
public abstract class TenantAwareEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id") // Nullable initially for migration
    private Project project;
}
