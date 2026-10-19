-- ==============================================================================
-- Flyway Migration V61: Normalize SYSTEM Scope Permission Module Taxonomy
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
-- Deconstructs the monolithic 'system' module into precise functional modules:
-- organizations, gateway, observability, backup, billing, contracts, quotas,
-- security, settings, support, tenants, trash, etc.
-- ==============================================================================

-- 1. Normalisasi module pada seluruh permission SYSTEM berformat kanonikal: system.<modul>.<aksi>
UPDATE permissions
SET module = split_part(code, '.', 2),
    updated_at = NOW()
WHERE scope = 'SYSTEM'
  AND code LIKE 'system.%'
  AND code NOT IN ('system.view', 'system.manage');

-- 2. Tandai legacy aliases orgs.view dan orgs.manage sebagai DEPRECATED di description
UPDATE permissions
SET description = '[DEPRECATED: Use system.organizations.view] ' || COALESCE(description, 'View Organizations Directory'),
    updated_at = NOW()
WHERE code = 'orgs.view'
  AND description NOT LIKE '[DEPRECATED%';

UPDATE permissions
SET description = '[DEPRECATED: Use system.organizations.manage] ' || COALESCE(description, 'Manage Organization Subscriptions'),
    updated_at = NOW()
WHERE code = 'orgs.manage'
  AND description NOT LIKE '[DEPRECATED%';
