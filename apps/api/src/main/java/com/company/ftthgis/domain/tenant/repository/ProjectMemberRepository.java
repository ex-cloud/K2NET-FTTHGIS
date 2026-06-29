package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {
    boolean existsByUserIdAndProjectId(UUID userId, UUID projectId);
}
