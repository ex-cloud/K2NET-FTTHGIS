-- ==============================================================================
-- Flyway Migration V68: System Permissions Backfill, Anti-Lockout & Settings Cleanup
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Goals:
--   1. Register missing system permissions: system.ai.manage, system.task.manage
--   2. Anti-Lockout Backfill: grant billing.*, catalog.*, licensing.*, task.* to
--      non-super_admin SYSTEM roles holding legacy system.organizations.* permissions
--   3. Reorganize system_settings categories (COMMUNICATIONS, BRANDING, GENERAL, INTEGRATION)
--   Strict Multi-Tenant Isolation: Only roles with scope = 'SYSTEM' are updated.
-- ==============================================================================

-- 1. DAFTARKAN PERMISSION SISTEM YANG HILANG (SCOPE = 'SYSTEM')
INSERT INTO permissions (code, name, module, scope, description, created_at, updated_at) VALUES
    ('system.ai.manage', 'Manage AI Copilot & Knowledge Base', 'ai', 'SYSTEM', 'Grants access to manage AI copilot embeddings, semantic knowledge base, and model configs', NOW(), NOW()),
    ('system.task.manage', 'Manage Platform Tasks & Projects', 'task', 'SYSTEM', 'Grants access to manage system tasks, Linear project tracking, and B2B escalations', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 2. BERIKAN PERMISSION BARU KE ROLE SUPER_ADMIN
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE p.code IN ('system.ai.manage', 'system.task.manage')
  AND r.name = 'super_admin' AND r.scope = 'SYSTEM'
ON CONFLICT (permission_id, role_id) DO NOTHING;

-- 3. ANTI-LOCKOUT BACKFILL: ROLE SYSTEM_BILLING
-- Role system_billing sebelumnya hanya memiliki system.organizations.* sehingga
-- wajib mendapatkan seluruh hak operasional penagihan dan katalog komersial.
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'system_billing' AND r.scope = 'SYSTEM'
  AND p.code IN (
      'billing.read',
      'billing.subscriptions.read',
      'billing.subscriptions.manage',
      'billing.invoices.read',
      'billing.invoices.manage',
      'billing.packages.view',
      'billing.manage',
      'catalog.plans.read',
      'catalog.policies.read',
      'catalog.templates.read',
      'licensing.read'
  )
ON CONFLICT (permission_id, role_id) DO NOTHING;

-- 4. ANTI-LOCKOUT BACKFILL: ROLE SYSTEM_SUPPORT
-- Role system_support mengelola tiket dan asistensi tenant, membutuhkan akses
-- ke tugas Linear, status lisensi, perpanjangan, dan ikhtisar penagihan.
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'system_support' AND r.scope = 'SYSTEM'
  AND p.code IN (
      'system.task.manage',
      'licensing.read',
      'licensing.extend',
      'catalog.plans.read',
      'billing.read',
      'billing.invoices.read'
  )
ON CONFLICT (permission_id, role_id) DO NOTHING;

-- 5. ANTI-LOCKOUT BACKFILL: ROLE ACCOUNT_MANAGER
-- Role account_manager memantau status tenant, kuota, dan kepatuhan faktur pembayaran.
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'account_manager' AND r.scope = 'SYSTEM'
  AND p.code IN (
      'billing.read',
      'billing.invoices.read',
      'billing.subscriptions.read',
      'catalog.plans.read',
      'licensing.read'
  )
ON CONFLICT (permission_id, role_id) DO NOTHING;

-- 6. ANTI-LOCKOUT BACKFILL: ROLE PLATFORM_ENGINEER
-- Role platform_engineer mengelola gateway, AI knowledge base, dan tugas SRE.
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE r.name = 'platform_engineer' AND r.scope = 'SYSTEM'
  AND p.code IN (
      'system.ai.manage',
      'system.task.manage'
  )
ON CONFLICT (permission_id, role_id) DO NOTHING;

-- 7. PEMBERSIHAN & PERAPIHAN KATEGORI SYSTEM_SETTINGS
-- Memindahkan kunci konfigurasi yang sebelumnya salah kelompok ke domain yang semestinya:
UPDATE system_settings 
SET category = 'COMMUNICATIONS', updated_at = NOW() 
WHERE config_key IN ('wa_gateway_api_url', 'wa_gateway_enabled', 'wa_gateway_token', 'wa_otp_enabled');

UPDATE system_settings 
SET category = 'BRANDING', updated_at = NOW() 
WHERE config_key IN ('brand_accent_color', 'footer_copyright');

UPDATE system_settings 
SET category = 'GENERAL', updated_at = NOW() 
WHERE config_key = 'maintenance_message';

UPDATE system_settings 
SET category = 'INTEGRATION', updated_at = NOW() 
WHERE config_key = 'github_integration';
