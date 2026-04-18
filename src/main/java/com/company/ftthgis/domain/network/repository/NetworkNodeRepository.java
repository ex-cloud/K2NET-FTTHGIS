package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.NetworkNode;
import com.company.ftthgis.domain.network.repository.projection.AssetMapProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NetworkNodeRepository extends JpaRepository<NetworkNode, Long> {
    Optional<NetworkNode> findByOsmid(Long osmid);
    boolean existsByCode(String code);

    @Query(value = """
        SELECT n.id, n.code, n.status, n.node_type as nodeType, ST_Y(n.geom) as lat, ST_X(n.geom) as lng 
        FROM network_nodes n
        JOIN projects p ON n.project_id = p.id
        JOIN organizations o ON p.org_id = o.id
        WHERE o.slug = :orgSlug 
        AND (:projectId IS NULL OR p.id = :projectId)
    """, nativeQuery = true)
    List<AssetMapProjection> findAllByOrgSlugAndProjectId(@Param("orgSlug") String orgSlug, @Param("projectId") String projectId);
}
