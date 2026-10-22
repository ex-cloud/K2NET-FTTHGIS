package com.company.ftthgis.domain.tenant.repository;

import com.company.ftthgis.domain.tenant.entity.PlanVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlanVersionRepository extends JpaRepository<PlanVersion, UUID> {

    @Query("SELECT pv FROM PlanVersion pv WHERE pv.plan.id = :planId ORDER BY pv.createdAt DESC")
    List<PlanVersion> findByPlanIdOrderByCreatedAtDesc(@Param("planId") UUID planId);

    @Query("SELECT pv FROM PlanVersion pv WHERE pv.plan.id = :planId AND pv.version = :version")
    Optional<PlanVersion> findByPlanIdAndVersion(@Param("planId") UUID planId, @Param("version") String version);

    @Query("SELECT pv FROM PlanVersion pv WHERE pv.plan.id = :planId AND pv.status = :status ORDER BY pv.createdAt DESC")
    List<PlanVersion> findByPlanIdAndStatusOrderByCreatedAtDesc(@Param("planId") UUID planId, @Param("status") String status);

    default Optional<PlanVersion> findFirstByPlanIdAndStatusOrderByCreatedAtDesc(UUID planId, String status) {
        List<PlanVersion> list = findByPlanIdAndStatusOrderByCreatedAtDesc(planId, status);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }
}
