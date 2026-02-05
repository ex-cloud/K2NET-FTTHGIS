package com.company.ftthgis.api.network;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/network/mvt")
public class MvtController {

    @PersistenceContext
    private EntityManager entityManager;

    @GetMapping(value = "/{z}/{x}/{y}", produces = "application/x-protobuf")
    public ResponseEntity<byte[]> getMvt(@PathVariable int z, @PathVariable int x, @PathVariable int y) {
        // Zoom-based source selection for optimal performance
        // Zoom < 10: Use clustered materialized view
        // Zoom >= 10: Use full detail nodes

        String nodeQuery;
        if (z < 10) {
            // Use clustered view for low zoom levels (performance optimization for large
            // datasets)
            nodeQuery = """
                    mvt_nodes AS (
                        SELECT ST_AsMvtGeom(ST_Transform(c.geom, 3857), bounds.tile_geom) AS geom,
                               c.id, c.node_type, c.aggregated_status AS status,
                               c.avg_signal_db AS signal_db, c.point_count
                        FROM mv_clustered_nodes c, bounds
                        WHERE c.geom && bounds.bbox_geom
                          AND ST_Intersects(c.geom, bounds.bbox_geom)
                    )
                    """;

        } else {
            // Use full detail for high zoom levels with code from child tables
            nodeQuery = """
                    mvt_nodes AS (
                        SELECT ST_AsMvtGeom(ST_Transform(n.geom, 3857), bounds.tile_geom) AS geom,
                               n.id, n.node_type, n.status, n.signal_db, 1 AS point_count,
                               COALESCE(olt.code, odc.code, odp.code, cust.code) AS code
                        FROM network_nodes n
                        LEFT JOIN olt ON n.id = olt.id
                        LEFT JOIN odc ON n.id = odc.id
                        LEFT JOIN odp ON n.id = odp.id
                        LEFT JOIN customers cust ON n.id = cust.id
                        CROSS JOIN bounds
                        WHERE n.geom && bounds.bbox_geom
                          AND ST_Intersects(n.geom, bounds.bbox_geom)
                    )
                    """;
        }

        // Build the final query using standard concatenation for reliability with line
        // endings
        StringBuilder sqlBuilder = new StringBuilder();
        sqlBuilder.append("WITH bounds AS (\n");
        sqlBuilder.append("    SELECT ST_TileEnvelope(?1, ?2, ?3) AS tile_geom,\n");
        sqlBuilder.append("           ST_Transform(ST_TileEnvelope(?1, ?2, ?3), 4326) AS bbox_geom\n");
        sqlBuilder.append("),\n");
        sqlBuilder.append(nodeQuery);
        sqlBuilder.append(", mvt_edges AS (\n");
        sqlBuilder.append("    SELECT ST_AsMvtGeom(ST_Transform(\n");
        sqlBuilder.append("        CASE\n");
        sqlBuilder.append("            WHEN ?1 < 13 THEN e.geometry_simple\n");
        sqlBuilder.append("            ELSE e.geom\n");
        sqlBuilder.append("        END, 3857), bounds.tile_geom) AS geom,\n");
        sqlBuilder.append("           e.id, e.status, e.fiber_count, e.code,\n");
        sqlBuilder.append("           CASE\n");
        sqlBuilder.append("               WHEN e.code LIKE 'FEEDER%' THEN 'FEEDER'\n");
        sqlBuilder.append("               WHEN e.code LIKE 'DIST%' THEN 'DISTRIBUTION'\n");
        sqlBuilder.append("               WHEN e.code LIKE 'DROP%' THEN 'DROP'\n");
        sqlBuilder.append("               ELSE 'OTHER'\n");
        sqlBuilder.append("           END AS cable_type\n");
        sqlBuilder.append("    FROM network_edges e, bounds\n");
        sqlBuilder.append("    WHERE e.geom && bounds.bbox_geom\n");
        sqlBuilder.append("      AND ST_Intersects(e.geom, bounds.bbox_geom)\n");
        sqlBuilder.append(")\n");
        sqlBuilder.append("SELECT (SELECT ST_AsMvt(mvt_nodes.*, 'nodes') FROM mvt_nodes) ||\n");
        sqlBuilder.append("       (SELECT ST_AsMvt(mvt_edges.*, 'edges') FROM mvt_edges) AS mvt");

        Query query = entityManager.createNativeQuery(sqlBuilder.toString());
        query.setParameter(1, z);
        query.setParameter(2, x);
        query.setParameter(3, y);

        byte[] tile = (byte[]) query.getSingleResult();

        if (tile == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/x-protobuf"))
                .header("Cache-Control", "public, max-age=300, stale-while-revalidate=60")
                .header("ETag", "\"" + z + "-" + x + "-" + y + "-" + tile.hashCode() + "\"")
                .body(tile);
    }
}
