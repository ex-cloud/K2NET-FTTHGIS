-- ==============================================================================
-- V78__prune_redundant_baseline_roles.sql
-- K2NET FTTH GIS: Streamline baseline system templates and tenant templates.
-- Removes redundant roles (platform_engineer, system_billing, supervisor, warehouse, auditor, vendor)
-- in favor of dynamic custom role creation via PBAC Role CRUD.
-- Includes full Hibernate Envers audit trail synchronization (roles_aud & role_permissions_aud).
-- ==============================================================================

-- 1. Detach permissions for redundant roles
DELETE FROM role_permissions
WHERE role_id IN (
    SELECT id FROM roles
    WHERE name IN ('platform_engineer', 'system_billing', 'supervisor', 'warehouse', 'auditor', 'vendor')
      AND organization_id IS NULL
);

-- 2. Nullify references in user tables if any
UPDATE organization_members
SET role_id = NULL
WHERE role_id IN (
    SELECT id FROM roles
    WHERE name IN ('platform_engineer', 'system_billing', 'supervisor', 'warehouse', 'auditor', 'vendor')
      AND organization_id IS NULL
);

UPDATE users
SET role_id = NULL
WHERE role_id IN (
    SELECT id FROM roles
    WHERE name IN ('platform_engineer', 'system_billing', 'supervisor', 'warehouse', 'auditor', 'vendor')
      AND organization_id IS NULL
);

UPDATE project_members
SET role_id = NULL
WHERE role_id IN (
    SELECT id FROM roles
    WHERE name IN ('platform_engineer', 'system_billing', 'supervisor', 'warehouse', 'auditor', 'vendor')
      AND organization_id IS NULL
);

-- 3. Delete redundant system/tenant roles
DELETE FROM roles
WHERE name IN ('platform_engineer', 'system_billing', 'supervisor', 'warehouse', 'auditor', 'vendor')
  AND organization_id IS NULL;

-- 4. Normalize and synchronize sequential codes for remaining baseline templates
-- System Roles (4 Core)
UPDATE roles SET code = 'SYS-01' WHERE name = 'super_admin' AND scope = 'SYSTEM' AND organization_id IS NULL;
UPDATE roles SET code = 'SYS-02' WHERE name = 'system_support' AND scope = 'SYSTEM' AND organization_id IS NULL;
UPDATE roles SET code = 'SYS-03' WHERE name = 'account_manager' AND scope = 'SYSTEM' AND organization_id IS NULL;
UPDATE roles SET code = 'SYS-04' WHERE name = 'system_auditor' AND scope = 'SYSTEM' AND organization_id IS NULL;

-- Tenant Roles (7 Core Templates)
UPDATE roles SET code = 'TENT-01' WHERE name = 'admin' AND scope = 'TENANT' AND organization_id IS NULL;
UPDATE roles SET code = 'TENT-02' WHERE name = 'noc' AND scope = 'TENANT' AND organization_id IS NULL;
UPDATE roles SET code = 'TENT-03' WHERE name = 'technician' AND scope = 'TENANT' AND organization_id IS NULL;
UPDATE roles SET code = 'TENT-04' WHERE name = 'surveyor' AND scope = 'TENANT' AND organization_id IS NULL;
UPDATE roles SET code = 'TENT-05' WHERE name = 'finance' AND scope = 'TENANT' AND organization_id IS NULL;
UPDATE roles SET code = 'TENT-06' WHERE name = 'helpdesk' AND scope = 'TENANT' AND organization_id IS NULL;
UPDATE roles SET code = 'TENT-07' WHERE name = 'viewer' AND scope = 'TENANT' AND organization_id IS NULL;

-- 5. Synchronize Hibernate Envers Audit Trail (roles_aud & role_permissions_aud)
-- STRICT ENVERS SCHEMA RULES:
--   - rev INTEGER NOT NULL REFERENCES revinfo(id)
--   - revtype SMALLINT (0=ADD, 1=MOD, 2=DEL)
--   - PRIMARY KEY (rev, id) on roles_aud
--   - PRIMARY KEY (rev, permission_id, role_id) on role_permissions_aud
DO $$
DECLARE
    v_rev INTEGER;
    v_timestamp BIGINT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'revinfo') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles_aud') THEN

        -- Allocate new revision from Hibernate Envers sequence
        SELECT nextval('revinfo_seq') INTO v_rev;
        SELECT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT INTO v_timestamp;

        -- Record revision metadata
        INSERT INTO revinfo (id, timestamp, username)
        VALUES (v_rev, v_timestamp, 'flyway_v78_prune_redundant_roles');

        -- Record deletions in roles_aud (revtype = 2) for redundant baseline roles
        INSERT INTO roles_aud (id, rev, revtype, name, code, display_name, description, is_system_role, scope, organization_id)
        SELECT r.id, v_rev, 2, r.name, r.code, r.display_name, r.description, r.is_system_role, r.scope, r.organization_id
        FROM (
            SELECT DISTINCT ON (id) id, name, code, display_name, description, is_system_role, scope, organization_id
            FROM roles_aud
            WHERE name IN ('platform_engineer', 'system_billing', 'supervisor', 'warehouse', 'auditor', 'vendor')
              AND organization_id IS NULL
            ORDER BY id, rev DESC
        ) r
        ON CONFLICT (rev, id) DO NOTHING;

        -- Record code updates in roles_aud (revtype = 1) for the remaining 11 baseline roles
        INSERT INTO roles_aud (id, rev, revtype, name, code, display_name, description, is_system_role, scope, organization_id)
        SELECT r.id, v_rev, 1, r.name, r.code, r.display_name, r.description, r.is_system_role, r.scope, r.organization_id
        FROM roles r
        WHERE r.organization_id IS NULL
        ON CONFLICT (rev, id) DO NOTHING;

        -- Record deletion in role_permissions_aud (revtype = 2) for detached permissions
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions_aud') THEN
            INSERT INTO role_permissions_aud (role_id, permission_id, rev, revtype)
            SELECT DISTINCT rpa.role_id, rpa.permission_id, v_rev, 2
            FROM role_permissions_aud rpa
            JOIN roles_aud ra ON ra.id = rpa.role_id
            WHERE ra.name IN ('platform_engineer', 'system_billing', 'supervisor', 'warehouse', 'auditor', 'vendor')
              AND ra.organization_id IS NULL
            ON CONFLICT (rev, permission_id, role_id) DO NOTHING;
        END IF;
    END IF;
END $$;

