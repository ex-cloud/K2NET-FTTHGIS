package com.company.ftthgis.config.tenant;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.Project;
import jakarta.persistence.EntityManager;
import java.util.UUID;
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
        // 1. Create Default Organization using Native SQL to ensure it's in DB immediately
        UUID org1Id = UUID.randomUUID();
        String orgSlug = "default";
        
        List<Organization> existingOrgs = entityManager
                .createQuery("SELECT o FROM Organization o WHERE o.slug = :slug", Organization.class)
                .setParameter("slug", orgSlug)
                .getResultList();

        if (existingOrgs.isEmpty()) {
            entityManager.createNativeQuery("INSERT INTO organizations (id, name, slug, description) VALUES (:id, :name, :slug, :desc)")
                    .setParameter("id", org1Id)
                    .setParameter("name", "ex-cloud's Org")
                    .setParameter("slug", orgSlug)
                    .setParameter("desc", "The primary organization for seeded data.")
                    .executeUpdate();
        } else {
            org1Id = existingOrgs.get(0).getId();
        }

        // 2. Create Default Project using Native SQL
        UUID proj1Id = UUID.nameUUIDFromBytes("ftth-gis-1".getBytes());
        List<Project> projs = entityManager
                .createQuery("SELECT p FROM Project p WHERE p.id = :pid", Project.class)
                .setParameter("pid", proj1Id)
                .getResultList();

        if (projs.isEmpty()) {
            entityManager.createNativeQuery("INSERT INTO projects (id, name, org_id) VALUES (:id, :name, :orgid)")
                    .setParameter("id", proj1Id)
                    .setParameter("name", "FTTH GIS BANDUNG")
                    .setParameter("orgid", org1Id)
                    .executeUpdate();
        }

        // 3. Create Secondary Project
        UUID proj2Id = UUID.nameUUIDFromBytes("ftth-gis-2".getBytes());
        List<Project> projs2 = entityManager
                .createQuery("SELECT p FROM Project p WHERE p.id = :pid", Project.class)
                .setParameter("pid", proj2Id)
                .getResultList();

        if (projs2.isEmpty()) {
            entityManager.createNativeQuery("INSERT INTO projects (id, name, org_id) VALUES (:id, :name, :orgid)")
                    .setParameter("id", proj2Id)
                    .setParameter("name", "FTTH GIS JABAR")
                    .setParameter("orgid", org1Id)
                    .executeUpdate();
        }

        // Force flush to be double sure
        entityManager.flush();

        // 4. Migrate all orphan assets to the default project (ex-cloud's)
        int updatedNodes = entityManager
                .createNativeQuery("UPDATE network_nodes SET project_id = :pid WHERE project_id IS NULL")
                .setParameter("pid", proj1Id)
                .executeUpdate();
        int updatedCables = entityManager
                .createNativeQuery("UPDATE network_edges SET project_id = :pid WHERE project_id IS NULL")
                .setParameter("pid", proj1Id)
                .executeUpdate();

        if (updatedNodes > 0 || updatedCables > 0) {
            System.out.println("✅ MIGRATION SUCCESSFUL: Linked " + updatedNodes + " nodes and " + updatedCables
                    + " cables to default Project.");
        }
    }
}
