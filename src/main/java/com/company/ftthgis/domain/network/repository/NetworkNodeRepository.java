package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.NetworkNode;
import com.company.ftthgis.domain.network.repository.projection.AssetMapProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NetworkNodeRepository extends JpaRepository<NetworkNode, Long> {
    Optional<NetworkNode> findByOsmid(Long osmid);
    boolean existsByCode(String code);

    @Query(value = "SELECT id, code, status, node_type as nodeType, ST_Y(geom) as lat, ST_X(geom) as lng FROM network_nodes", nativeQuery = true)
    List<AssetMapProjection> findAllForMap();
}
