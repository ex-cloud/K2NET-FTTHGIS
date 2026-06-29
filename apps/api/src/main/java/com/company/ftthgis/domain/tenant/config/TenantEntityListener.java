package com.company.ftthgis.domain.tenant.config;

import com.company.ftthgis.config.tenant.TenantContext;
import com.company.ftthgis.config.tenant.OrganizationContext;
import com.company.ftthgis.domain.common.BaseEntity;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.entity.Organization;
import jakarta.persistence.PrePersist;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Slf4j
public class TenantEntityListener {

    @PrePersist
    public void prePersist(Object entity) {
        if (entity instanceof BaseEntity baseEntity) {
            String projectId = TenantContext.getTenantId();
            
            if (projectId != null && baseEntity.getProject() == null) {
                log.debug("🛡️ Auto-assigning project {} to entity: {}", projectId, entity.getClass().getSimpleName());
                Project project = new Project();
                project.setId(UUID.fromString(projectId));
                baseEntity.setProject(project);
            }
            
            UUID orgId = OrganizationContext.getOrganizationId();
            if (orgId != null && baseEntity.getOrganization() == null) {
                log.debug("🛡️ Auto-assigning organization {} to entity: {}", orgId, entity.getClass().getSimpleName());
                Organization org = new Organization();
                org.setId(orgId);
                baseEntity.setOrganization(org);
            }
        }
    }
}
