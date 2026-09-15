-- V42__split_organizations_webhook_permission.sql
-- Granular PBAC Refinement: Pemisahan permission mutasi profil organisasi vs teknis API Key & Webhooks

-- 1. Daftarkan permission spesifik Webhooks & API Keys
INSERT INTO permissions (code, name, description, module, scope, created_at, updated_at) VALUES
  ('system.organizations.webhooks.manage', 'Manage Platform Webhooks & API Keys', 'Menerbitkan ulang API Key, mengelola HMAC Secret, Scoped Tokens, dan Webhook Endpoints seluruh tenant', 'system', 'SYSTEM', NOW(), NOW()),
  ('organizations.webhooks.manage',        'Manage Tenant Webhooks & API Keys',   'Menerbitkan ulang API Key, mengelola HMAC Secret, Scoped Tokens, dan Webhook Endpoints di tingkat tenant', 'organizations', 'TENANT', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  module = EXCLUDED.module,
  scope = EXCLUDED.scope,
  updated_at = NOW();

-- 2. Perbarui deskripsi system.organizations.update menjadi khusus profil/metadata
UPDATE permissions 
SET description = 'Mengubah profil, nama ISP, kontak, alamat, dan metadata organisasi tenant'
WHERE code = 'system.organizations.update';

-- 3. super_admin: Memperoleh seluruh permission termasuk system.organizations.webhooks.manage
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'super_admin' AND r.is_system_role = true
  AND p.code = 'system.organizations.webhooks.manage'
ON CONFLICT DO NOTHING;

-- 4. platform_engineer: Diberikan system.organizations.webhooks.manage
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'platform_engineer' AND r.is_system_role = true
  AND p.code = 'system.organizations.webhooks.manage'
ON CONFLICT DO NOTHING;

-- 5. platform_engineer: HAPUS hak system.organizations.update (profil) dan system.organizations.manage (subscriptions)
DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'platform_engineer' AND is_system_role = true LIMIT 1)
  AND permission_id IN (
    SELECT id FROM permissions WHERE code IN ('system.organizations.update', 'system.organizations.manage')
  );

-- 6. account_manager: Pastikan HANYA memiliki view, create, update (tidak memiliki webhooks.manage)
DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'account_manager' AND is_system_role = true LIMIT 1)
  AND permission_id IN (
    SELECT id FROM permissions WHERE code = 'system.organizations.webhooks.manage'
  );

-- 7. Tenant Admin role template: Diberikan organizations.webhooks.manage
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'admin' AND r.scope = 'TENANT' AND r.is_system_role = true
  AND p.code = 'organizations.webhooks.manage'
ON CONFLICT DO NOTHING;
