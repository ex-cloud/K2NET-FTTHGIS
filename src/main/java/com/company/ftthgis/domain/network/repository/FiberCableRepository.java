package com.company.ftthgis.domain.network.repository;

import com.company.ftthgis.domain.network.entity.FiberCable;
import com.company.ftthgis.domain.network.repository.projection.FiberCableProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FiberCableRepository extends JpaRepository<FiberCable, Long> {
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
                        "  :startNode, :endNode, false" +
                        ") as r " +
                        "JOIN network_edges c ON r.edge = c.id " +
                        "ORDER BY r.seq", nativeQuery = true)
        List<FiberCableProjection> findShortestPath(int startNode, int endNode);
}
