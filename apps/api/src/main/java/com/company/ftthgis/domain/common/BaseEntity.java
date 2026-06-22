package com.company.ftthgis.domain.common;

import com.company.ftthgis.domain.tenant.config.TenantEntityListener;
import com.company.ftthgis.domain.tenant.entity.OrganizationAwareEntity;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MappedSuperclass;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import lombok.experimental.SuperBuilder;

@MappedSuperclass
@EntityListeners({AuditingEntityListener.class, TenantEntityListener.class})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@FilterDef(name = "tenantFilter", parameters = {@ParamDef(name = "projectId", type = String.class)})
@Filter(name = "tenantFilter", condition = "project_id = CAST(:projectId AS uuid)")
public abstract class BaseEntity extends OrganizationAwareEntity {

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id") // Nullable initially to prevent migration crashes on existing data
    private Project project;

    @JsonProperty("project_id")
    public java.util.UUID getProjectIdValue() {
        return project != null ? project.getId() : null;
    }
}
