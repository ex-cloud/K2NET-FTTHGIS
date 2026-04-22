package com.company.ftthgis.domain.analytics.repository;

import com.company.ftthgis.domain.analytics.entity.NetworkEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NetworkEventRepository extends JpaRepository<NetworkEvent, Long> {

    // Fetch events within a specific time range (for Chart Scatter Plot)
    List<NetworkEvent> findByTimestampBetweenOrderByTimestampAsc(LocalDateTime from, LocalDateTime to);

    List<NetworkEvent> findByTimestampBetweenAndProjectIdOrderByTimestampAsc(
            LocalDateTime from, LocalDateTime to, String projectId);

    // Fetch latest events for activity log
    List<NetworkEvent> findTop50ByOrderByTimestampDesc();

    List<NetworkEvent> findTop50ByProjectIdOrderByTimestampDesc(String projectId);

    List<NetworkEvent> findTop20ByAssetCodeOrderByTimestampDesc(String assetCode);
}
