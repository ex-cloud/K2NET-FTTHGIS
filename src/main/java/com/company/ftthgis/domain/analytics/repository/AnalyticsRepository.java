package com.company.ftthgis.domain.analytics.repository;

import com.company.ftthgis.domain.network.entity.NetworkNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AnalyticsRepository extends JpaRepository<NetworkNode, Long> {

    @Query(value = "SELECT COUNT(*) FROM network_nodes WHERE status = 'UP'", nativeQuery = true)
    long countActiveNodes();

    @Query(value = "SELECT COUNT(*) FROM network_nodes WHERE status = 'DOWN'", nativeQuery = true)
    long countDownNodes();

    @Query(value = "SELECT COALESCE(SUM(ST_Length(CAST(geom AS geography))) / 1000, 0) FROM network_edges", nativeQuery = true)
    double calculateTotalNetworkLengthKm();

    // Just a helper to count all nodes (JpaRepository has count() but explicit
    // query is sometimes clearer for specific criteria)
    @Query(value = "SELECT COUNT(*) FROM network_nodes", nativeQuery = true)
    long countTotalNodes();
}
