package com.company.ftthgis.domain.tenant.entity;

import com.company.ftthgis.domain.common.AuditableEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import lombok.experimental.SuperBuilder;

@MappedSuperclass
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@FilterDef(name = "organizationFilter", parameters = {@ParamDef(name = "organizationId", type = String.class)})
@Filter(name = "organizationFilter", condition = "organization_id = CAST(:organizationId AS uuid)")
public abstract class OrganizationAwareEntity extends AuditableEntity {
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @JsonProperty("organization_id")
    public java.util.UUID getOrganizationIdValue() {
        return organization != null ? organization.getId() : null;
    }
}
