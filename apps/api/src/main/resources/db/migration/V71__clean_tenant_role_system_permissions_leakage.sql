-- V71__clean_tenant_role_system_permissions_leakage.sql
-- Security Hardening: Normalize system-scoped permissions and purge cross-scope leakage from tenant roles

-- 1. Pastikan seluruh permission sistem memiliki scope = 'SYSTEM'
UPDATE permissions
SET scope = 'SYSTEM'
WHERE scope IS DISTINCT FROM 'SYSTEM'
  AND (
    code LIKE 'system.%'
    OR code LIKE 'platform.%'
    OR code LIKE 'support.%'
    OR code LIKE 'catalog.%'
    OR code LIKE 'licensing.%'
    OR code LIKE 'billing.subscriptions.%'
    OR code LIKE 'billing.invoices.%'
    OR code IN ('billing.read', 'orgs.view', 'orgs.manage')
  );

-- 2. Hapus seluruh kebocoran permission SYSTEM dari role TENANT (baik template maupun cloned org role)
DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND p.scope = 'SYSTEM'
  AND (r.scope = 'TENANT' OR r.organization_id IS NOT NULL);

-- 3. Cabut system.security.manage dari role system_support untuk menerapkan prinsip least-privilege
DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.name = 'system_support'
  AND p.code = 'system.security.manage';
