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
    List<Project> findByOrganizationSlugAndStatus(String slug, Project.ProjectStatus status);
    List<Project> findByOrganizationIdAndStatus(UUID orgId, Project.ProjectStatus status);
    long countByOrganizationId(UUID orgId);
    long countByOrganizationIdAndStatus(UUID orgId, Project.ProjectStatus status);
    boolean existsByCodeAndOrganizationId(String code, UUID organizationId);

    @Query("SELECT p FROM Project p JOIN p.members m WHERE p.organization.slug = :slug AND m.user.id = :userId")
    List<Project> findByOrganizationSlugAndUserId(@Param("slug") String slug, @Param("userId") UUID userId);

    @Query("SELECT p FROM Project p JOIN p.members m WHERE p.organization.slug = :slug AND m.user.id = :userId AND p.status = :status")
    List<Project> findByOrganizationSlugAndUserIdAndStatus(
        @Param("slug") String slug,
        @Param("userId") UUID userId,
        @Param("status") Project.ProjectStatus status
    );
}
