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
        SELECT ST_AsMvtGeom(ST_Transform(n.geom, 3857), bounds.tile_geom) AS geom,
               n.id, n.node_type, n.status, n.signal_db, 1 as point_count, n.code
        FROM network_nodes n, bounds
        WHERE n.geom && bounds.bbox_geom 
              AND (query->>'project_id' IS NULL OR query->>'project_id' = '' OR n.project_id::text = query->>'project_id')
    ),
    mvt_edges AS (
        SELECT ST_AsMvtGeom(ST_Transform(
            CASE WHEN z < 13 THEN e.geometry_simple ELSE e.geom END, 3857), bounds.tile_geom) AS geom,
               e.id, e.status, e.fiber_count, e.code
        FROM network_edges e, bounds
        WHERE e.geom && bounds.bbox_geom 
              AND (query->>'project_id' IS NULL OR query->>'project_id' = '' OR e.project_id::text = query->>'project_id')
    )
    SELECT (SELECT ST_AsMvt(mvt_nodes.*, 'nodes') FROM mvt_nodes) || 
           (SELECT ST_AsMvt(mvt_edges.*, 'edges') FROM mvt_edges) INTO mvt;

    RETURN mvt;
END;
$$ LANGUAGE plpgsql VOLATILE STRICT PARALLEL SAFE;