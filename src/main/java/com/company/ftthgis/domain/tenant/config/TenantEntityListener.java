package com.company.ftthgis.domain.tenant.config;

import com.company.ftthgis.config.tenant.TenantContext;
import com.company.ftthgis.domain.common.BaseEntity;
import com.company.ftthgis.domain.tenant.entity.Project;
import jakarta.persistence.PrePersist;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class TenantEntityListener {

    @PrePersist
    public void prePersist(Object entity) {
        if (entity instanceof BaseEntity baseEntity) {
            String projectId = TenantContext.getTenantId();
            
            if (projectId != null && baseEntity.getProject() == null) {
                log.debug("🛡️ Auto-assigning project {} to entity: {}", projectId, entity.getClass().getSimpleName());
                
                // We create a proxy project object with just the ID to avoid extra DB hit
                Project project = new Project();
                project.setId(projectId);
                
                baseEntity.setProject(project);
            }
        }
    }
}
