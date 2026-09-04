-- V33__add_system_module_permissions.sql
-- Penutupan Celah Otorisasi: Menambahkan 7 permission scope SYSTEM dan memetakan ke role sistem

INSERT INTO permissions (code, name, module, scope, description, created_at, updated_at) VALUES
  ('system.gateway.manage', 'Manage Gateway Config', 'system', 'SYSTEM', 'Mengubah konfigurasi .env 13 Go Gateway', NOW(), NOW()),
  ('system.security.manage', 'Manage Platform Security', 'system', 'SYSTEM', 'Revoke sesi Keycloak, IP blocking, konfigurasi SSO, verifikasi device', NOW(), NOW()),
  ('system.trash.manage', 'Manage Recycle Bin', 'system', 'SYSTEM', 'Restore dan hard-purge data soft-deleted lintas organisasi', NOW(), NOW()),
  ('system.settings.manage', 'Manage Platform Settings', 'system', 'SYSTEM', 'SMTP relay, SRID GIS, whitelabel branding platform', NOW(), NOW()),
  ('system.backup.manage', 'Manage Backups', 'system', 'SYSTEM', 'Trigger backup, download, dan hapus artifact backup', NOW(), NOW()),
  ('system.observability.view', 'View Platform Observability', 'system', 'SYSTEM', 'Telemetry DB, Keycloak, Kong, DevOps stats, system health, dan status gateway', NOW(), NOW()),
  ('system.integration.manage', 'Manage External Integrations', 'system', 'SYSTEM', 'Konfigurasi GitHub App dan integrasi CI/CD', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- 1. super_admin: Memperoleh seluruh 7 permission baru + system.audit.view
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'super_admin' AND p.code IN (
  'system.gateway.manage',
  'system.security.manage',
  'system.trash.manage',
  'system.settings.manage',
  'system.backup.manage',
  'system.observability.view',
  'system.integration.manage',
  'system.audit.view'
)
ON CONFLICT DO NOTHING;

-- 2. platform_engineer: gateway.manage, backup.manage, observability.view, integration.manage
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'platform_engineer' AND p.code IN (
  'system.gateway.manage',
  'system.backup.manage',
  'system.observability.view',
  'system.integration.manage'
)
ON CONFLICT DO NOTHING;

-- 3. system_auditor: observability.view, system.audit.view
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'system_auditor' AND p.code IN (
  'system.observability.view',
  'system.audit.view'
)
ON CONFLICT DO NOTHING;

-- 4. system_support: security.manage (revoke sessions), observability.view
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'system_support' AND p.code IN (
  'system.security.manage',
  'system.observability.view'
)
ON CONFLICT DO NOTHING;
