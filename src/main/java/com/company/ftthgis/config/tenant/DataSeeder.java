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
        // 1. Create Default Organization (ex-cloud's Org) if not exists
        Organization defaultOrg = getOrCreateOrg("ex-cloud's Org", "default", "The primary organization for seeded data.");
        
        // 2. Create k2net Organization (Empty) if not exists
        getOrCreateOrg("k2net", "k2net", "A secondary organization for testing manual inputs.");

        // 3. Create Default Project under the 'default' Org if not exists
        List<Project> projs = entityManager
                .createQuery("SELECT p FROM Project p WHERE p.id = 'ftth-gis-1'", Project.class)
                .setMaxResults(1)
                .getResultList();

        if (projs.isEmpty()) {
            Project newProj = Project.builder()
                    .id("ftth-gis-1")
                    .name("FTTH GIS BANDUNG")
                    .organization(defaultOrg)
                    .build();
            entityManager.persist(newProj);
        }

        // 3b. Create second project under the 'default' Org if not exists
        List<Project> projs2 = entityManager
                .createQuery("SELECT p FROM Project p WHERE p.id = 'ftth-gis-2'", Project.class)
                .setMaxResults(1)
                .getResultList();

        if (projs2.isEmpty()) {
            Project newProj2 = Project.builder()
                    .id("ftth-gis-2")
                    .name("FTTH GIS JABAR")
                    .organization(defaultOrg)
                    .build();
            entityManager.persist(newProj2);
        }

        // 4. Migrate all orphan assets to the default project (ex-cloud's)
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

    private Organization getOrCreateOrg(String name, String slug, String description) {
        List<Organization> orgs = entityManager
                .createQuery("SELECT o FROM Organization o WHERE o.slug = :slug", Organization.class)
                .setParameter("slug", slug)
                .setMaxResults(1)
                .getResultList();

        if (orgs.isEmpty()) {
            Organization org = Organization.builder()
                    .name(name)
                    .slug(slug)
                    .description(description)
                    .build();
            entityManager.persist(org);
            return org;
        }
        return orgs.get(0);
    }
}
