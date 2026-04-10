package com.company.ftthgis.domain.analytics.repository;

import com.company.ftthgis.domain.network.entity.NetworkNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.data.domain.Pageable;

@Repository
public interface AnalyticsRepository extends JpaRepository<NetworkNode, Long> {

    @Query("SELECT COUNT(n) FROM NetworkNode n WHERE n.status = 'UP' OR n.status = 'ACTIVE'")
    long countActiveNodes();

    @Query("SELECT COUNT(n) FROM NetworkNode n WHERE n.status = 'DOWN' OR n.status = 'BROKEN' OR n.status = 'FIBERCUT' OR n.status = 'MAINTENANCE'")
    long countDownNodes();

    @Query(value = "SELECT COALESCE(SUM(ST_Length(CAST(geom AS geography))) / 1000, 0) FROM network_edges", nativeQuery = true)
    double calculateTotalNetworkLengthKm();

    @Query("SELECT COUNT(n) FROM NetworkNode n")
    long countTotalNodes();

    @Query("SELECT n FROM NetworkNode n WHERE n.status NOT IN ('ACTIVE', 'UP', 'PLANNING') ORDER BY n.id DESC")
    List<NetworkNode> findTop10ProblematicNodes(Pageable pageable);
}
