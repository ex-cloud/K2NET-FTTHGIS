package com.company.ftthgis.domain.analytics.repository;

import com.company.ftthgis.domain.network.entity.NetworkNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

@Repository
public interface AnalyticsRepository extends JpaRepository<NetworkNode, Long> {

    @Query("SELECT COUNT(n) FROM NetworkNode n WHERE (n.status = 'UP' OR n.status = 'ACTIVE') AND n.project.id = :projectId")
    long countActiveNodes(@Param("projectId") String projectId);

    @Query("SELECT COUNT(n) FROM NetworkNode n WHERE (n.status = 'DOWN' OR n.status = 'BROKEN' OR n.status = 'FIBERCUT' OR n.status = 'MAINTENANCE') AND n.project.id = :projectId")
    long countDownNodes(@Param("projectId") String projectId);

    @Query(value = "SELECT COALESCE(SUM(ST_Length(CAST(geom AS geography))) / 1000, 0) FROM network_edges WHERE project_id = :projectId", nativeQuery = true)
    double calculateTotalNetworkLengthKm(@Param("projectId") String projectId);

    @Query("SELECT COUNT(n) FROM NetworkNode n WHERE n.project.id = :projectId")
    long countTotalNodes(@Param("projectId") String projectId);

    @Query("SELECT n FROM NetworkNode n WHERE n.project.id = :projectId AND n.status NOT IN ('ACTIVE', 'UP', 'PLANNING') ORDER BY n.updatedAt DESC, n.id DESC")
    List<NetworkNode> findTop10ProblematicNodes(@Param("projectId") String projectId, Pageable pageable);
}
