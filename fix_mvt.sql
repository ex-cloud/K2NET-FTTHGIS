CREATE OR REPLACE FUNCTION get_mvt_data(z integer, x integer, y integer, query json)
RETURNS bytea AS $$
DECLARE
    mvt bytea;
BEGIN
    WITH bounds AS (
        SELECT ST_TileEnvelope(z, x, y) AS tile_geom,
               ST_Transform(ST_TileEnvelope(z, x, y), 4326) AS bbox_geom
    ),
    mvt_nodes AS (
        SELECT ST_AsMvtGeom(ST_Transform(raw_nodes.geom, 3857), bounds.tile_geom) AS geom,
               raw_nodes.id, raw_nodes.node_type, raw_nodes.status, raw_nodes.signal_db, raw_nodes.point_count, raw_nodes.code
        FROM (
            SELECT 
                CASE WHEN z < 10 THEN c.geom ELSE n.geom END as geom,
                CASE WHEN z < 10 THEN c.id ELSE n.id END as id,
                CASE WHEN z < 10 THEN c.node_type ELSE n.node_type END as node_type,
                CASE WHEN z < 10 THEN aggregated_status ELSE n.status END as status,
                CASE WHEN z < 10 THEN avg_signal_db ELSE n.signal_db END as signal_db,
                CASE WHEN z < 10 THEN point_count ELSE 1 END as point_count,
                CASE WHEN z >= 10 THEN n.code ELSE NULL END as code
            FROM bounds
            LEFT JOIN mv_clustered_nodes c ON z < 10 AND c.geom && bounds.bbox_geom
            LEFT JOIN network_nodes n ON z >= 10 AND n.geom && bounds.bbox_geom
            WHERE (z < 10 AND c.id IS NOT NULL) OR (z >= 10 AND n.id IS NOT NULL)
        ) raw_nodes, bounds
    ),
    mvt_edges AS (
        SELECT ST_AsMvtGeom(ST_Transform(
            CASE WHEN z < 13 THEN e.geometry_simple ELSE e.geom END, 3857), bounds.tile_geom) AS geom,
               e.id, e.status, e.fiber_count, e.code
        FROM network_edges e, bounds
        WHERE e.geom && bounds.bbox_geom
    )
    SELECT (SELECT ST_AsMvt(mvt_nodes.*, 'nodes') FROM mvt_nodes) || 
           (SELECT ST_AsMvt(mvt_edges.*, 'edges') FROM mvt_edges) INTO mvt;

    RETURN mvt;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE;