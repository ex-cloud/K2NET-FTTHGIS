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
        StringBuilder sqlBuilder = new StringBuilder();
        sqlBuilder.append("WITH bounds AS (\n");
        sqlBuilder.append("    SELECT ST_TileEnvelope(?1, ?2, ?3) AS tile_geom,\n");
        sqlBuilder.append("           ST_Transform(ST_TileEnvelope(?1, ?2, ?3), 4326) AS bbox_geom\n");
        sqlBuilder.append("),\n");
        sqlBuilder.append("mvt_nodes AS (\n");
        sqlBuilder.append("    SELECT ST_AsMvtGeom(ST_Transform(m.geom, 3857), bounds.tile_geom) AS geom,\n");
        sqlBuilder.append("           m.feature_id AS id, m.node_type, m.status, m.health_status, m.code\n");
        sqlBuilder.append("    FROM map_features_cache m, bounds\n");
        sqlBuilder.append("    WHERE m.feature_type = 'NODE'\n");
        sqlBuilder.append("      AND m.geom && bounds.bbox_geom\n");
        sqlBuilder.append("      AND ST_Intersects(m.geom, bounds.bbox_geom)\n");
        sqlBuilder.append("),\n");
        sqlBuilder.append("mvt_edges AS (\n");
        sqlBuilder.append("    SELECT ST_AsMvtGeom(ST_Transform(m.geom, 3857), bounds.tile_geom) AS geom,\n");
        sqlBuilder.append("           m.feature_id AS id, m.status, m.code,\n");
        sqlBuilder.append("           CASE\n");
        sqlBuilder.append("               WHEN m.code LIKE 'FEEDER%' THEN 'FEEDER'\n");
        sqlBuilder.append("               WHEN m.code LIKE 'DIST%' THEN 'DISTRIBUTION'\n");
        sqlBuilder.append("               WHEN m.code LIKE 'DROP%' THEN 'DROP'\n");
        sqlBuilder.append("               ELSE 'OTHER'\n");
        sqlBuilder.append("           END AS cable_type\n");
        sqlBuilder.append("    FROM map_features_cache m, bounds\n");
        sqlBuilder.append("    WHERE m.feature_type = 'EDGE'\n");
        sqlBuilder.append("      AND m.geom && bounds.bbox_geom\n");
        sqlBuilder.append("      AND ST_Intersects(m.geom, bounds.bbox_geom)\n");
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
