package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.PlanVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlanVersionRepository extends JpaRepository<PlanVersion, UUID> {
    List<PlanVersion> findByPlanIdOrderByCreatedAtDesc(UUID planId);
    Optional<PlanVersion> findByPlanIdAndVersion(UUID planId, String version);
    Optional<PlanVersion> findFirstByPlanIdAndStatusOrderByCreatedAtDesc(UUID planId, String status);
}
