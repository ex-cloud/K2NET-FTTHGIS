package com.company.ftthgis.domain.analytics.repository;

import com.company.ftthgis.domain.analytics.entity.DashboardSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DashboardSnapshotRepository extends JpaRepository<DashboardSnapshot, Long> {

    /**
     * Find all snapshots within a date range, ordered chronologically.
     */
    List<DashboardSnapshot> findByRecordedAtBetweenOrderByRecordedAtAsc(
            LocalDateTime from, LocalDateTime to);

    /**
     * Delete old snapshots beyond retention period (e.g. > 90 days).
     */
    long deleteByRecordedAtBefore(LocalDateTime before);
}
