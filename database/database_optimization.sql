-- ==========================================
-- PHASE 1: DATABASE OPTIMIZATION SCRIPT
-- ==========================================

-- 0. ENABLE QUERY PERFORMANCE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 1. ADDITIONAL INDEXES
CREATE INDEX IF NOT EXISTS idx_network_edges_project_id ON network_edges (project_id);
CREATE INDEX IF NOT EXISTS idx_network_edges_status ON network_edges (status);

-- 2. MVT DISPLAY CACHE (For 60FPS Map Performance)
CREATE TABLE IF NOT EXISTS map_features_cache (
    feature_id BIGINT,
    code VARCHAR(255),
    feature_type VARCHAR(50), -- 'NODE' or 'EDGE'
    node_type VARCHAR(50),    -- 'OLT', 'ODC', etc.
    status VARCHAR(50),
    health_status VARCHAR(50),
    project_id VARCHAR(255),
    geom GEOMETRY,
    PRIMARY KEY (feature_id, feature_type)
);

CREATE INDEX IF NOT EXISTS idx_map_cache_geom ON map_features_cache USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_map_cache_project ON map_features_cache (project_id);

-- TRIGGER TO SYNC NODES
CREATE OR REPLACE FUNCTION sync_node_to_cache() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        DELETE FROM map_features_cache WHERE feature_id = OLD.id AND feature_type = 'NODE';
    ELSE
        INSERT INTO map_features_cache (feature_id, code, feature_type, node_type, status, health_status, project_id, geom)
        VALUES (NEW.id, NEW.code, 'NODE', NEW.node_type, NEW.status, NEW.health_status, NEW.project_id, NEW.geom)
        ON CONFLICT (feature_id, feature_type) DO UPDATE SET
            code = EXCLUDED.code,
            node_type = EXCLUDED.node_type,
            status = EXCLUDED.status,
            health_status = EXCLUDED.health_status,
            project_id = EXCLUDED.project_id,
            geom = EXCLUDED.geom;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_sync_node_cache
AFTER INSERT OR UPDATE OR DELETE ON network_nodes
FOR EACH ROW EXECUTE FUNCTION sync_node_to_cache();

-- TRIGGER TO SYNC EDGES
CREATE OR REPLACE FUNCTION sync_edge_to_cache() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        DELETE FROM map_features_cache WHERE feature_id = OLD.id AND feature_type = 'EDGE';
    ELSE
        INSERT INTO map_features_cache (feature_id, code, feature_type, node_type, status, health_status, project_id, geom)
        VALUES (NEW.id, NEW.code, 'EDGE', 'CABLE', NEW.status, 'UP', NEW.project_id, NEW.geom)
        ON CONFLICT (feature_id, feature_type) DO UPDATE SET
            code = EXCLUDED.code,
            status = EXCLUDED.status,
            project_id = EXCLUDED.project_id,
            geom = EXCLUDED.geom;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_sync_edge_cache
AFTER INSERT OR UPDATE OR DELETE ON network_edges
FOR EACH ROW EXECUTE FUNCTION sync_edge_to_cache();

-- INITIAL SEED FOR CACHE
INSERT INTO map_features_cache (feature_id, code, feature_type, node_type, status, health_status, project_id, geom)
SELECT id, code, 'NODE', node_type, status, health_status, project_id, geom FROM network_nodes
ON CONFLICT DO NOTHING;

INSERT INTO map_features_cache (feature_id, code, feature_type, node_type, status, health_status, project_id, geom)
SELECT id, code, 'EDGE', 'CABLE', status, 'UP', project_id, geom FROM network_edges
ON CONFLICT DO NOTHING;

-- 3. AUDIT LOG PARTITIONING (Month-based)
-- Rename existing to keep data
ALTER TABLE network_event_history RENAME TO network_event_history_old;

-- Create new partitioned table
CREATE TABLE network_event_history (
    id BIGINT NOT NULL,
    timestamp TIMESTAMP(6) NOT NULL,
    asset_code VARCHAR(255) NOT NULL,
    asset_type VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    new_status VARCHAR(255) NOT NULL,
    old_status VARCHAR(255) NOT NULL,
    project_id VARCHAR(255) NOT NULL,
    reason VARCHAR(255),
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create initial partitions for 2025
CREATE TABLE network_event_history_y2025m01 PARTITION OF network_event_history FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE network_event_history_y2025m02 PARTITION OF network_event_history FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE network_event_history_y2025m03 PARTITION OF network_event_history FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE network_event_history_y2025m04 PARTITION OF network_event_history FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE network_event_history_y2025m05 PARTITION OF network_event_history FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');

-- Migrate data back from old table
INSERT INTO network_event_history SELECT * FROM network_event_history_old;

-- Restore Indexes
CREATE INDEX idx_event_timestamp_part ON network_event_history (timestamp);
CREATE INDEX idx_event_asset_code_part ON network_event_history (asset_code);
