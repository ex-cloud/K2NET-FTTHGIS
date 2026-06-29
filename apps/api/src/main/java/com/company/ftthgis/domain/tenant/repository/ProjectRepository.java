package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByOrganizationId(UUID orgId);
    List<Project> findByOrganizationSlug(String slug);
    long countByOrganizationId(UUID orgId);

    @Query("SELECT p FROM Project p JOIN p.members m WHERE p.organization.slug = :slug AND m.user.id = :userId")
    List<Project> findByOrganizationSlugAndUserId(@Param("slug") String slug, @Param("userId") UUID userId);
}
