-- ==============================================================================
-- Flyway Migration V70: Workspace & Support Granular Permissions and Anti-Lockout Backfill
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Goals:
--   1. Ensure Envers audit table column integrity (permissions_aud, role_permissions_aud).
--   2. Register granular system permissions for Workspace (Platform) and Support (Operations).
--   3. Anti-Lockout Backfill: grant platform.* and support.* permissions to
--      super_admin, platform_engineer, system_support, account_manager, and any
--      system role holding legacy system.task.manage.
--   Strict Multi-Tenant Isolation: Only roles with scope = 'SYSTEM' are updated.
-- ==============================================================================

-- ============================================================
-- 0. SINKRONISASI INTEGRITAS ENVERS AUDIT (Idempotent Safety)
-- ============================================================
ALTER TABLE permissions_aud ADD COLUMN IF NOT EXISTS module VARCHAR(50);

-- ============================================================
-- 1. DAFTARKAN PERMISSION GRANULAR BARU (SCOPE = 'SYSTEM')
-- ============================================================
INSERT INTO permissions (code, name, module, scope, description, created_at, updated_at) VALUES
    ('platform.projects.view',   'View Workspace Projects & Specs',   'platform', 'SYSTEM', 'Grants view access to platform internal workspace projects, TipTap specifications, and roadmap milestones', NOW(), NOW()),
    ('platform.projects.manage', 'Manage Workspace Projects & Specs', 'platform', 'SYSTEM', 'Grants full management access to create, edit, archive, and delete platform workspace projects and TipTap specs', NOW(), NOW()),
    ('platform.issues.view',     'View Engineering Issues Backlog',   'platform', 'SYSTEM', 'Grants view access to platform engineering issues, internal tasks, bugs, and technical todos', NOW(), NOW()),
    ('platform.issues.manage',   'Manage Engineering Issues Backlog', 'platform', 'SYSTEM', 'Grants management access to create, assign, update, and resolve platform engineering issues', NOW(), NOW()),
    ('support.tickets.view',     'View B2B Tenant Support Tickets',   'support',  'SYSTEM', 'Grants view access to B2B tenant escalation support tickets, Tenant 360 context, and SLA timers', NOW(), NOW()),
    ('support.tickets.manage',   'Manage B2B Tenant Support Tickets', 'support',  'SYSTEM', 'Grants access to respond to, update status of, and escalate B2B tenant support tickets to internal engineering issues', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================
-- 2. BERIKAN SELURUH PERMISSION BARU KE ROLE SUPER_ADMIN
-- ============================================================
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE p.code IN (
    'platform.projects.view',
    'platform.projects.manage',
    'platform.issues.view',
    'platform.issues.manage',
    'support.tickets.view',
    'support.tickets.manage'
)
  AND r.name = 'super_admin' AND r.scope = 'SYSTEM'
ON CONFLICT (permission_id, role_id) DO NOTHING;

-- ============================================================
-- 3. ANTI-LOCKOUT BACKFILL: ROLE PLATFORM_ENGINEER
-- Platform engineer memegang kendali atas ruang kerja arsitektur & issue engineering.
-- ============================================================
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'platform_engineer' AND r.scope = 'SYSTEM'
  AND p.code IN (
    'platform.projects.view',
    'platform.projects.manage',
    'platform.issues.view',
    'platform.issues.manage'
  )
ON CONFLICT (permission_id, role_id) DO NOTHING;

-- ============================================================
-- 4. ANTI-LOCKOUT BACKFILL: ROLE SYSTEM_SUPPORT
-- System support menangani antrean tiket eskalasi tenant dan dapat melihat issue engineering terkait.
-- ============================================================
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'system_support' AND r.scope = 'SYSTEM'
  AND p.code IN (
    'support.tickets.view',
    'support.tickets.manage',
    'platform.issues.view'
  )
ON CONFLICT (permission_id, role_id) DO NOTHING;

-- ============================================================
-- 5. ANTI-LOCKOUT BACKFILL: ROLE ACCOUNT_MANAGER
-- Account manager memantau kepuasan tenant dan status tiket eskalasi B2B (read-only).
-- ============================================================
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'account_manager' AND r.scope = 'SYSTEM'
  AND p.code IN (
    'support.tickets.view'
  )
ON CONFLICT (permission_id, role_id) DO NOTHING;

-- ============================================================
-- 6. PROPAGASI KE ROLE KUSTOM SYSTEM PEMEGANG system.task.manage
-- Menjamin role custom apapun yang memegang izin task lama tidak kehilangan hak akses.
-- ============================================================
INSERT INTO role_permissions (permission_id, role_id)
SELECT p_new.id, rp_old.role_id
FROM role_permissions rp_old
JOIN permissions p_old ON rp_old.permission_id = p_old.id
JOIN roles r ON rp_old.role_id = r.id
CROSS JOIN permissions p_new
WHERE p_old.code = 'system.task.manage'
  AND r.scope = 'SYSTEM'
  AND p_new.code IN (
    'platform.projects.view',
    'platform.projects.manage',
    'platform.issues.view',
    'platform.issues.manage',
    'support.tickets.view',
    'support.tickets.manage'
  )
ON CONFLICT (permission_id, role_id) DO NOTHING;
