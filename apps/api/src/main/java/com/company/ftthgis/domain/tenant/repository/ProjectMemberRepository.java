package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {
    boolean existsByUserIdAndProjectId(UUID userId, UUID projectId);

    Optional<ProjectMember> findByUserIdAndProjectId(UUID userId, UUID projectId);

    @Query("SELECT pm.project.id FROM ProjectMember pm WHERE pm.user.id = :userId")
    Set<UUID> findProjectIdsByUserId(@Param("userId") UUID userId);
}

