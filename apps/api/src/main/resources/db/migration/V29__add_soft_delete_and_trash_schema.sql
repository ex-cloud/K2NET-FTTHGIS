-- ==============================================================================
-- K2NET FTTH GIS — Soft Delete & Enterprise Recycle Bin Schema
-- Migration: V29__add_soft_delete_and_trash_schema.sql
-- ==============================================================================

-- 1. Organizations Soft Delete
ALTER TABLE organizations 
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_active 
    ON organizations (id) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_trash 
    ON organizations (deleted_at DESC) 
    WHERE deleted_at IS NOT NULL;

-- 2. Projects Soft Delete
ALTER TABLE projects 
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_active 
    ON projects (organization_id, id) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_trash 
    ON projects (deleted_at DESC) 
    WHERE deleted_at IS NOT NULL;

-- 3. Tasks Soft Delete
ALTER TABLE tasks 
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_active 
    ON tasks (organization_id, id) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_trash 
    ON tasks (deleted_at DESC) 
    WHERE deleted_at IS NOT NULL;

-- 4. Network Nodes Soft Delete (Tiang, OLT, ODC, ODP, Closure)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'network_nodes') THEN
        ALTER TABLE network_nodes 
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;

        CREATE INDEX IF NOT EXISTS idx_network_nodes_active 
            ON network_nodes (organization_id, id) 
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_network_nodes_trash 
            ON network_nodes (deleted_at DESC) 
            WHERE deleted_at IS NOT NULL;
    END IF;
END $$;

-- 5. Network Edges Soft Delete (Kabel Fiber Optik, Span)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'network_edges') THEN
        ALTER TABLE network_edges 
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;

        CREATE INDEX IF NOT EXISTS idx_network_edges_active 
            ON network_edges (organization_id, id) 
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_network_edges_trash 
            ON network_edges (deleted_at DESC) 
            WHERE deleted_at IS NOT NULL;
    END IF;
END $$;
