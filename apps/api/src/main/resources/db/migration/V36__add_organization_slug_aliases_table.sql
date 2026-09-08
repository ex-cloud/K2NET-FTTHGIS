-- ==============================================================================
-- K2NET FTTH GIS — Multi-Tier Subdomain Governance & Slug Aliases
-- Migration: V36__add_organization_slug_aliases_table.sql
-- ==============================================================================

-- 1. Create organization_slug_aliases table
CREATE TABLE IF NOT EXISTS organization_slug_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    old_slug VARCHAR(64) NOT NULL,
    migrated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_slug_aliases_old_slug ON organization_slug_aliases(old_slug);
CREATE INDEX IF NOT EXISTS idx_org_slug_aliases_org_id ON organization_slug_aliases(organization_id);

-- 2. Add slug_type and custom_domain columns to organizations
ALTER TABLE organizations 
    ADD COLUMN IF NOT EXISTS slug_type VARCHAR(16) DEFAULT 'CUSTOM',
    ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT FALSE;

-- Ensure existing organizations are marked as CUSTOM
UPDATE organizations 
SET slug_type = 'CUSTOM' 
WHERE slug_type IS NULL;

-- 3. Update Envers audit table if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations_aud') THEN
        ALTER TABLE organizations_aud 
            ADD COLUMN IF NOT EXISTS slug_type VARCHAR(16) DEFAULT 'CUSTOM',
            ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 4. Register new Granular PBAC Permission: system.tenants.migrate_slug
INSERT INTO permissions (code, name, description, module, scope, created_at, updated_at) VALUES
('system.tenants.migrate_slug', 'MIGRATE TENANT SUBDOMAIN', 'Allows controlled subdomain migration and renaming for tenant organizations', 'system', 'SYSTEM', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET 
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  module = EXCLUDED.module, 
  scope = EXCLUDED.scope;

-- Map system.tenants.migrate_slug to super_admin and account_manager
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name IN ('super_admin', 'account_manager') AND p.code = 'system.tenants.migrate_slug'
ON CONFLICT DO NOTHING;
