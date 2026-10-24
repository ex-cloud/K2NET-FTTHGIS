-- ==============================================================================
-- Flyway Migration V72: Rename platform.projects.* to platform.workspace.* Permissions
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Goals:
--   1. Rename permission codes and display names from 'platform.projects.*'
--      to 'platform.workspace.*' to reflect the unified Workspace architecture
--      (embracing Plans, Ideas, Master Specs, Architecture RFCs, and Initiatives).
--   2. Maintain zero-breakage: Existing role_permissions rows remain intact
--      because they reference permissions.id (UUID foreign key).
--   3. Synchronize Envers audit table (permissions_aud) for tracking.
-- ==============================================================================

-- 1. Rename 'platform.projects.view' -> 'platform.workspace.view'
UPDATE permissions
SET code = 'platform.workspace.view',
    name = 'View Platform Workspace (Plans & Specs)',
    description = 'Grants view access to platform internal workspace (Plans, Ideas, Master Specs, Architecture RFCs, and Initiatives)',
    updated_at = NOW()
WHERE code = 'platform.projects.view';

-- 2. Rename 'platform.projects.manage' -> 'platform.workspace.manage'
UPDATE permissions
SET code = 'platform.workspace.manage',
    name = 'Manage Platform Workspace (Plans & Specs)',
    description = 'Grants management access to create, edit, archive, and delete platform workspace plans, specs, ideas, and initiatives',
    updated_at = NOW()
WHERE code = 'platform.projects.manage';

-- 3. Idempotent Safety: In case permissions were not found under old name, insert canonical codes
INSERT INTO permissions (code, name, module, scope, description, created_at, updated_at)
VALUES
    ('platform.workspace.view',   'View Platform Workspace (Plans & Specs)',   'platform', 'SYSTEM', 'Grants view access to platform internal workspace (Plans, Ideas, Master Specs, Architecture RFCs, and Initiatives)', NOW(), NOW()),
    ('platform.workspace.manage', 'Manage Platform Workspace (Plans & Specs)', 'platform', 'SYSTEM', 'Grants management access to create, edit, archive, and delete platform workspace plans, specs, ideas, and initiatives', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 4. Ensure super_admin and platform_engineer hold the canonical workspace permissions
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE p.code IN ('platform.workspace.view', 'platform.workspace.manage')
  AND r.name = 'super_admin' AND r.scope = 'SYSTEM'
ON CONFLICT (permission_id, role_id) DO NOTHING;

INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE p.code IN ('platform.workspace.view', 'platform.workspace.manage')
  AND r.name = 'platform_engineer' AND r.scope = 'SYSTEM'
ON CONFLICT (permission_id, role_id) DO NOTHING;
