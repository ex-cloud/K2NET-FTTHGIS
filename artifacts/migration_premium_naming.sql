-- PREMIUM MIGRATION: Standardizing to 'organization_id' across all tenant-aware tables
-- This script renames 'org_id' to 'organization_id' and adds it to missing tables.

-- 1. Table: users
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='org_id') THEN
        ALTER TABLE users RENAME COLUMN org_id TO organization_id;
    END IF;
END $$;

-- 2. Table: projects
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='org_id') THEN
        ALTER TABLE projects RENAME COLUMN org_id TO organization_id;
    END IF;
END $$;

-- 3. Table: project_members (Missing column)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='project_members' AND column_name='organization_id') THEN
        ALTER TABLE project_members ADD COLUMN organization_id UUID;
        -- Link to existing organization from project if possible
        UPDATE project_members pm SET organization_id = p.organization_id FROM projects p WHERE pm.project_id = p.id;
        -- If still null, default to the first organization found
        UPDATE project_members SET organization_id = (SELECT id FROM organizations LIMIT 1) WHERE organization_id IS NULL;
        ALTER TABLE project_members ALTER COLUMN organization_id SET NOT NULL;
        ALTER TABLE project_members ADD CONSTRAINT fk_project_members_org FOREIGN KEY (organization_id) REFERENCES organizations(id);
    END IF;
END $$;

-- 4. Table: network_nodes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='network_nodes' AND column_name='organization_id') THEN
        ALTER TABLE network_nodes ADD COLUMN organization_id UUID;
        -- Link to existing organization from project
        UPDATE network_nodes n SET organization_id = p.organization_id FROM projects p WHERE n.project_id = p.id;
        -- Default for orphan nodes
        UPDATE network_nodes SET organization_id = (SELECT id FROM organizations LIMIT 1) WHERE organization_id IS NULL;
        ALTER TABLE network_nodes ALTER COLUMN organization_id SET NOT NULL;
        ALTER TABLE network_nodes ADD CONSTRAINT fk_network_nodes_org FOREIGN KEY (organization_id) REFERENCES organizations(id);
    END IF;
END $$;

-- 5. Table: network_edges
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='network_edges' AND column_name='organization_id') THEN
        ALTER TABLE network_edges ADD COLUMN organization_id UUID;
        -- Link to existing organization from project
        UPDATE network_edges e SET organization_id = p.organization_id FROM projects p WHERE e.project_id = p.id;
        -- Default for orphan edges
        UPDATE network_edges SET organization_id = (SELECT id FROM organizations LIMIT 1) WHERE organization_id IS NULL;
        ALTER TABLE network_edges ALTER COLUMN organization_id SET NOT NULL;
        ALTER TABLE network_edges ADD CONSTRAINT fk_network_edges_org FOREIGN KEY (organization_id) REFERENCES organizations(id);
    END IF;
END $$;
