package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.NetworkNode;
import com.company.ftthgis.domain.network.repository.projection.AssetMapProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NetworkNodeRepository extends JpaRepository<NetworkNode, UUID> {
    Optional<NetworkNode> findByOsmid(Long osmid);
    Optional<NetworkNode> findByCode(String code);
    boolean existsByCode(String code);

    @Query("SELECT COUNT(n) FROM NetworkNode n WHERE n.nodeType = :type AND n.project.id = :projectId")
    long countByTypeAndProjectId(@org.springframework.data.repository.query.Param("type") String type, @org.springframework.data.repository.query.Param("projectId") UUID projectId);

    @Query(value = """
        SELECT n.id, n.code, n.status, n.node_type as nodeType, ST_Y(n.geom) as lat, ST_X(n.geom) as lng 
        FROM network_nodes n
        JOIN organizations o ON n.organization_id = o.id
        LEFT JOIN projects p ON n.project_id = p.id
        WHERE o.slug = :orgSlug 
        AND (:projectId IS NULL OR n.project_id = :projectId)
    """, nativeQuery = true)
    List<AssetMapProjection> findAllByOrgSlugAndProjectId(@Param("orgSlug") String orgSlug, @Param("projectId") UUID projectId);

    void deleteByOrganizationId(UUID organizationId);
    long countByOrganizationId(UUID organizationId);
    long countByOrganizationIdAndNodeType(UUID organizationId, String nodeType);

    @Query(value = """
        SELECT COUNT(n.id)
        FROM network_nodes n
        LEFT JOIN project_zones z ON n.zone_id = z.id
        WHERE n.organization_id = :orgId
          AND n.node_type = 'ODP'
          AND n.deleted_at IS NULL
          AND (
              (z.id IS NOT NULL AND z.stage IN ('CONSTRUCTION', 'LIVE'))
              OR (z.id IS NULL AND (n.status IS NULL OR n.status NOT IN ('PLANNING', 'DRAFT')))
          )
    """, nativeQuery = true)
    long countBillableOdpsByOrganizationId(@Param("orgId") UUID orgId);

    @Query("SELECT n FROM NetworkNode n WHERE n.zone.id = :zoneId AND n.deletedAt IS NULL")
    List<NetworkNode> findByZoneId(@Param("zoneId") UUID zoneId);

    @Query(value = """
        SELECT n.* FROM network_nodes n
        JOIN project_zones z ON z.id = :zoneId
        WHERE n.project_id = :projectId
          AND n.deleted_at IS NULL
          AND ST_Within(n.geom, z.boundary_geom) = true
    """, nativeQuery = true)
    List<NetworkNode> findNodesWithinZoneBoundary(@Param("projectId") UUID projectId, @Param("zoneId") UUID zoneId);

    @Query("SELECT DISTINCT n.project.id FROM NetworkNode n WHERE n.id IN :ids AND n.project IS NOT NULL")
    java.util.Set<UUID> findDistinctProjectIdsByIdIn(@Param("ids") List<UUID> ids);
}

