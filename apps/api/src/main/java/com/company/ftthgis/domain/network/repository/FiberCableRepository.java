package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.FiberCable;
import com.company.ftthgis.domain.network.repository.projection.FiberCableProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FiberCableRepository extends JpaRepository<FiberCable, UUID> {
        boolean existsByCode(String code);

        java.util.Optional<FiberCable> findByCode(String code);

        // Removed ::geometry casts to avoid Hibernate detecting them as parameters
        @Query(value = "SELECT id as id, code as code, ST_SetSRID(COALESCE(geometry_simple, geom), 4326) as geometry, status as status "
                        +
                        "FROM network_edges WHERE ST_SetSRID(COALESCE(geometry_simple, geom), 4326) && ST_MakeEnvelope(:xmin, :ymin, :xmax, :ymax, 4326)", nativeQuery = true)
        List<FiberCableProjection> findByBoundingBox(double xmin, double ymin, double xmax, double ymax);

        /**
         * Mengambil jalur terpendek menggunakan algoritma Dijkstra pgRouting.
         */
        @Query(value = "SELECT c.id as id, c.code as code, c.geom as geometry, c.status as status " +
                        "FROM pgr_dijkstra(" +
                        "  'SELECT id, source, target, cost FROM network_edges', " +
                        "  (SELECT v.id FROM network_edges_vertices_pgr v JOIN network_nodes n ON ST_DWithin(n.geom, v.the_geom, 0.00001) WHERE n.id = :startNodeId LIMIT 1), " +
                        "  (SELECT v.id FROM network_edges_vertices_pgr v JOIN network_nodes n ON ST_DWithin(n.geom, v.the_geom, 0.00001) WHERE n.id = :endNodeId LIMIT 1), " +
                        "  false" +
                        ") as r " +
                        "JOIN network_edges c ON r.edge = c.id " +
                        "ORDER BY r.seq", nativeQuery = true)
        List<FiberCableProjection> findShortestPath(@Param("startNodeId") UUID startNodeId, @Param("endNodeId") UUID endNodeId);

        @Query("SELECT SUM(c.lengthMeters) FROM FiberCable c WHERE c.project.id = :projectId")
        Double sumLengthByProjectId(@Param("projectId") UUID projectId);

        void deleteByOrganizationId(UUID organizationId);
        long countByOrganizationId(UUID organizationId);

        @Query("SELECT DISTINCT c.project.id FROM FiberCable c WHERE c.id IN :ids AND c.project IS NOT NULL")
        java.util.Set<UUID> findDistinctProjectIdsByIdIn(@Param("ids") java.util.List<UUID> ids);
}

