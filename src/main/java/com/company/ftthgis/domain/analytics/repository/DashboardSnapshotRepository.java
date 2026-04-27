package com.company.ftthgis.domain.analytics.repository;

import com.company.ftthgis.domain.analytics.entity.DashboardSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface DashboardSnapshotRepository extends JpaRepository<DashboardSnapshot, Long> {

    List<DashboardSnapshot> findByRecordedAtBetweenAndProjectIdOrderByRecordedAtAsc(
            LocalDateTime from, LocalDateTime to, UUID projectId);

    /**
     * Delete old snapshots beyond retention period (e.g. > 90 days).
     */
    long deleteByRecordedAtBefore(LocalDateTime before);
}
