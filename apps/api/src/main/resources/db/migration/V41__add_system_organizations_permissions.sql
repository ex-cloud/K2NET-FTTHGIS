-- V41__add_system_organizations_permissions.sql
-- Standar Granular PBAC: Menambahkan permission resmi scope SYSTEM untuk manajemen Organisasi & Webhook

-- 1. Daftarkan Permissions Atomik Modul Organisasi (Scope SYSTEM)
INSERT INTO permissions (code, name, description, module, scope, created_at, updated_at) VALUES
  ('system.organizations.view', 'View Organizations Directory', 'Melihat direktori seluruh organisasi tenant, telemetry API, dan konfigurasi webhook', 'system', 'SYSTEM', NOW(), NOW()),
  ('system.organizations.create', 'Create Tenant Organization', 'Mendaftarkan organisasi tenant baru dan provisioning awal', 'system', 'SYSTEM', NOW(), NOW()),
  ('system.organizations.update', 'Update Organization & Webhooks', 'Mengubah data organisasi, menerbitkan ulang API Key, memutasi webhook endpoint, dan scoped tokens', 'system', 'SYSTEM', NOW(), NOW()),
  ('system.organizations.delete', 'Delete Tenant Organization', 'Menghapus atau terminasi organisasi tenant secara permanen', 'system', 'SYSTEM', NOW(), NOW()),
  ('system.organizations.manage', 'Manage Organization Lifecycle & Subscriptions', 'Mengelola siklus langganan, booster kuota, masa trial, dan konfigurasi menyeluruh tenant', 'system', 'SYSTEM', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  module = EXCLUDED.module,
  scope = EXCLUDED.scope,
  updated_at = NOW();

-- 2. Mapping ke Role Sistem: super_admin (Seluruh 5 permission)
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'super_admin' AND r.is_system_role = true
  AND p.code IN (
    'system.organizations.view',
    'system.organizations.create',
    'system.organizations.update',
    'system.organizations.delete',
    'system.organizations.manage'
  )
ON CONFLICT DO NOTHING;

-- 3. Mapping ke Role Sistem: platform_engineer (view, update, manage)
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'platform_engineer' AND r.is_system_role = true
  AND p.code IN (
    'system.organizations.view',
    'system.organizations.update',
    'system.organizations.manage'
  )
ON CONFLICT DO NOTHING;

-- 4. Mapping ke Role Sistem: account_manager (view, create, update)
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'account_manager' AND r.is_system_role = true
  AND p.code IN (
    'system.organizations.view',
    'system.organizations.create',
    'system.organizations.update'
  )
ON CONFLICT DO NOTHING;

-- 5. Mapping ke Role Sistem: system_support (view)
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'system_support' AND r.is_system_role = true
  AND p.code IN (
    'system.organizations.view'
  )
ON CONFLICT DO NOTHING;

-- 6. Mapping ke Role Sistem: system_billing (view, manage)
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'system_billing' AND r.is_system_role = true
  AND p.code IN (
    'system.organizations.view',
    'system.organizations.manage'
  )
ON CONFLICT DO NOTHING;

-- 7. Mapping ke Role Sistem: system_auditor (view)
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'system_auditor' AND r.is_system_role = true
  AND p.code IN (
    'system.organizations.view'
  )
ON CONFLICT DO NOTHING;
