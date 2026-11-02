-- ==============================================================================
-- Flyway Migration V77: Multi-Tenant Organization Membership & Decoupling
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Goals:
--   1. Create organization_members junction table for 1 User -> N Workspaces.
--   2. Create organization_members_aud Envers audit table with rev INTEGER.
--   3. Backfill active tenant users into organization_members idempotently.
--   4. Add last_active_organization_id to users and users_aud.
--   5. Register granular PBAC permissions for multi-tenant membership.
-- ==============================================================================

-- 1. Create organization_members Table
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_id BIGINT REFERENCES roles(id) ON DELETE SET NULL,
    role_name VARCHAR(50) NOT NULL DEFAULT 'viewer',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INVITED, SUSPENDED
    is_default BOOLEAN NOT NULL DEFAULT false,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    invitation_token VARCHAR(255),
    invitation_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    CONSTRAINT uq_organization_members_user_org UNIQUE (user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_token ON organization_members(invitation_token);

-- 2. Create Envers Audit Table (organization_members_aud)
-- STRICT ENVERS SCHEMA RULES:
--   - rev INTEGER NOT NULL REFERENCES revinfo(id) (INTEGER matching revinfo.id)
--   - revtype SMALLINT (0=ADD, 1=MOD, 2=DEL)
--   - AuditableEntity columns: created_at, created_by, updated_at, updated_by
--   - PRIMARY KEY (id, rev)
CREATE TABLE IF NOT EXISTS organization_members_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    user_id UUID,
    organization_id UUID,
    role_id BIGINT,
    role_name VARCHAR(50),
    status VARCHAR(30),
    is_default BOOLEAN,
    joined_at TIMESTAMPTZ,
    invitation_token VARCHAR(255),
    invitation_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(255),
    PRIMARY KEY (id, rev)
);

-- 3. Idempotent Data Backfill from Existing users Table
INSERT INTO organization_members (
    user_id, 
    organization_id, 
    role_id, 
    role_name, 
    status, 
    is_default, 
    joined_at, 
    created_at, 
    updated_at
)
SELECT 
    u.id, 
    u.organization_id, 
    u.role_id, 
    COALESCE(r.name, 'admin'), 
    'ACTIVE', 
    true, 
    COALESCE(u.created_at, NOW()), 
    COALESCE(u.created_at, NOW()), 
    NOW()
FROM users u
LEFT JOIN roles r ON r.id = u.role_id
WHERE u.organization_id IS NOT NULL
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- 4. Add last_active_organization_id to users and users_aud
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS last_active_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE users_aud 
    ADD COLUMN IF NOT EXISTS last_active_organization_id UUID;

UPDATE users 
SET last_active_organization_id = organization_id 
WHERE last_active_organization_id IS NULL AND organization_id IS NOT NULL;

-- 5. Register Granular PBAC Permissions
-- 5a. SYSTEM Scope Permissions
INSERT INTO permissions (code, name, module, scope, description, created_at, updated_at) VALUES
    ('system.members.view',   'View All Organization Memberships',   'system', 'SYSTEM', 'Grants global view access to user-workspace associations across all tenants', NOW(), NOW()),
    ('system.members.manage', 'Manage All Organization Memberships', 'system', 'SYSTEM', 'Grants management access to reassign, suspend, or link users to any workspace', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 5b. TENANT Scope Permissions
INSERT INTO permissions (code, name, module, scope, description, created_at, updated_at) VALUES
    ('members.view',   'View Workspace Members',   'organization', 'TENANT', 'Grants view access to team members within the active workspace', NOW(), NOW()),
    ('members.manage', 'Manage Workspace Members', 'organization', 'TENANT', 'Grants ability to update member roles and revoke access in the workspace', NOW(), NOW()),
    ('members.invite', 'Invite Workspace Members', 'organization', 'TENANT', 'Grants ability to dispatch workspace invitation links to prospective team members', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 5c. Grant SYSTEM Permissions to super_admin
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE p.code IN ('system.members.view', 'system.members.manage')
  AND r.name = 'super_admin' AND r.scope = 'SYSTEM'
ON CONFLICT (permission_id, role_id) DO NOTHING;

-- 5d. Grant TENANT Permissions to admin role
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE p.code IN ('members.view', 'members.manage', 'members.invite')
  AND r.name = 'admin' AND r.scope = 'TENANT'
ON CONFLICT (permission_id, role_id) DO NOTHING;

