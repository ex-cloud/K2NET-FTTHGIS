-- ==============================================================================
-- K2NET FTTH GIS — Add soft delete columns to Envers audit tables
-- Migration: V30__add_soft_delete_columns_to_envers_audit_tables.sql
-- ==============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations_aud') THEN
        ALTER TABLE organizations_aud 
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects_aud') THEN
        ALTER TABLE projects_aud 
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks_aud') THEN
        ALTER TABLE tasks_aud 
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'network_nodes_aud') THEN
        ALTER TABLE network_nodes_aud 
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'network_edges_aud') THEN
        ALTER TABLE network_edges_aud 
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;
    END IF;
END $$;
