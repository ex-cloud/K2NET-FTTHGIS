-- V11__fix_duplicate_super_admin_role.sql
-- Root cause: UserSeeder created super_admin role (id=22, code=NULL) before V9 migration
-- ran, which then inserted another super_admin (code=SYS-01) via ON CONFLICT that
-- didn't trigger because standard UNIQUE(name, organization_id) treats NULL != NULL.
--
-- Fix:
--   1. Migrate all users from old duplicate role (id=22) to the canonical one (code=SYS-01)
--   2. Delete the old duplicate role record
--   3. Add a partial unique index so this can never happen again

-- Step 1: Point all users who reference the old super_admin (code=NULL, id=22)
--         to the canonical super_admin (code=SYS-01)
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'super_admin' AND code = 'SYS-01' LIMIT 1)
WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin' AND code IS NULL LIMIT 1);

-- Step 2: Remove role_permissions entries tied to the old duplicate role
DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin' AND code IS NULL LIMIT 1);

-- Step 3: Delete the old duplicate super_admin role (code=NULL)
DELETE FROM roles
WHERE name = 'super_admin'
  AND code IS NULL
  AND organization_id IS NULL;

-- Step 4: Add a partial unique index to prevent future duplicates for system-level roles
--         (organization_id IS NULL means it's a global/system role, not a per-tenant clone)
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_name_system_unique
    ON roles (name)
    WHERE organization_id IS NULL;
