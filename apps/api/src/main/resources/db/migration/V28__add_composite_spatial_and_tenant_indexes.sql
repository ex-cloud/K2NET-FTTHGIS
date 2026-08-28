-- ==============================================================================
-- K2NET FTTH GIS — Database Performance & Spatial Composite Indexing
-- Migration: V28__add_composite_spatial_and_tenant_indexes.sql
-- ==============================================================================

-- 1. Partial Spatial GiST Indexes for Ultra-Fast Map & Vector Tile Queries
CREATE INDEX IF NOT EXISTS idx_tasks_org_location_geom 
    ON tasks USING GIST (location_geom) 
    WHERE location_geom IS NOT NULL AND organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_org_boundary_geom 
    ON projects USING GIST (boundary_geom) 
    WHERE boundary_geom IS NOT NULL AND organization_id IS NOT NULL;

-- If network_nodes table exists in database (spatial nodes layer)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'network_nodes') THEN
        CREATE INDEX IF NOT EXISTS idx_network_nodes_project_geom 
            ON network_nodes USING GIST (geom) 
            WHERE project_id IS NOT NULL;
    END IF;
END $$;

-- If network_edges table exists in database (spatial edges/cables layer)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'network_edges') THEN
        CREATE INDEX IF NOT EXISTS idx_network_edges_project_geom 
            ON network_edges USING GIST (geom) 
            WHERE project_id IS NOT NULL;
    END IF;
END $$;

-- 2. Multi-Tenant Relational B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_projects_org_created 
    ON projects (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_org_status_priority 
    ON tasks (organization_id, status, priority);

CREATE INDEX IF NOT EXISTS idx_users_org_status 
    ON users (organization_id, status);

-- 3. Audit Logging & System Telemetry Indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_events') THEN
        CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_occurred 
            ON audit_events (tenant_slug, occurred_at DESC);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'database_backups') THEN
        CREATE INDEX IF NOT EXISTS idx_database_backups_status_time 
            ON database_backups (status, backup_time DESC);
    END IF;
END $$;
