package com.company.ftthgis.config.tenant;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.Project;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class DataSeeder {

    @Autowired
    private EntityManager entityManager;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedInitialTenantAndMigrateAssets() {
        // 1. Create Default Organization if not exists
        List<Organization> orgs = entityManager
                .createQuery("SELECT o FROM Organization o WHERE o.slug = 'k2net'", Organization.class)
                .setMaxResults(1)
                .getResultList();

        Organization org;
        if (orgs.isEmpty()) {
            org = Organization.builder()
                    .name("K2Net")
                    .slug("k2net")
                    .build();
            entityManager.persist(org);
        } else {
            org = orgs.get(0);
        }

        // 2. Create Default Project if not exists
        List<Project> projs = entityManager
                .createQuery("SELECT p FROM Project p WHERE p.id = 'ftth-gis-1'", Project.class)
                .setMaxResults(1)
                .getResultList();

        if (projs.isEmpty()) {
            Project newProj = Project.builder()
                    .id("ftth-gis-1")
                    .name("FTTH GIS BANDUNG")
                    .organization(org)
                    .build();
            entityManager.persist(newProj);
        }

        // 3. Migrate all orphan assets to the default project
        int updatedNodes = entityManager
                .createNativeQuery("UPDATE network_nodes SET project_id = 'ftth-gis-1' WHERE project_id IS NULL")
                .executeUpdate();
        int updatedCables = entityManager
                .createNativeQuery("UPDATE network_edges SET project_id = 'ftth-gis-1' WHERE project_id IS NULL")
                .executeUpdate();

        if (updatedNodes > 0 || updatedCables > 0) {
            System.out.println("✅ MIGRATION SUCCESSFUL: Linked " + updatedNodes + " nodes and " + updatedCables
                    + " cables to default Project.");
        }
    }
}
