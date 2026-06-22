package com.company.ftthgis.domain.analytics.repository;

import com.company.ftthgis.domain.network.entity.NetworkNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

@Repository
public interface AnalyticsRepository extends JpaRepository<NetworkNode, UUID> {

    @Query(value = "SELECT COUNT(n.id) FROM network_nodes n WHERE (n.status = 'UP' OR n.status = 'ACTIVE') AND n.project_id = CAST(:projectId AS uuid)", nativeQuery = true)
    Long countActiveNodes(@Param("projectId") UUID projectId);

    @Query(value = "SELECT COUNT(n.id) FROM network_nodes n WHERE (n.status = 'DOWN' OR n.status = 'BROKEN' OR n.status = 'FIBERCUT' OR n.status = 'MAINTENANCE') AND n.project_id = CAST(:projectId AS uuid)", nativeQuery = true)
    Long countDownNodes(@Param("projectId") UUID projectId);

    @Query(value = "SELECT COALESCE(SUM(ST_Length(CAST(geom AS geography))) / 1000, 0) FROM network_edges WHERE project_id = CAST(:projectId AS uuid)", nativeQuery = true)
    Double calculateTotalNetworkLengthKm(@Param("projectId") UUID projectId);

    @Query(value = "SELECT COUNT(*) FROM network_nodes WHERE project_id = CAST(:projectId AS uuid)", nativeQuery = true)
    Long countTotalNodes(@Param("projectId") UUID projectId);

    @Query(value = "SELECT code, node_type, status, last_note FROM network_nodes WHERE project_id = CAST(:projectId AS uuid) AND status NOT IN ('ACTIVE', 'UP', 'PLANNING') ORDER BY updated_at DESC, id DESC LIMIT 10", nativeQuery = true)
    List<Object[]> findTop10ProblematicNodes(@Param("projectId") UUID projectId);
}
