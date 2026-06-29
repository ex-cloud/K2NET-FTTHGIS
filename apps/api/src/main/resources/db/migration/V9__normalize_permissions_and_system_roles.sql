-- V9__normalize_permissions_and_system_roles.sql
-- Step 1: Add code column to roles and roles_aud tables
ALTER TABLE roles ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE roles_aud ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- Step 2: Normalize permission modules to lowercase
UPDATE permissions SET module = LOWER(module);

-- Step 3: Consolidate 'tickets' to 'ticket' module
-- A. Ensure standard 'ticket.' permissions exist in the database
INSERT INTO permissions (code, name, description, module, scope) VALUES
('ticket.view', 'VIEW TICKET', 'Permission: ticket.view', 'ticket', 'TENANT'),
('ticket.create', 'CREATE TICKET', 'Permission: ticket.create', 'ticket', 'TENANT'),
('ticket.update', 'UPDATE TICKET', 'Permission: ticket.update', 'ticket', 'TENANT'),
('ticket.assign', 'ASSIGN TICKET', 'Permission: ticket.assign', 'ticket', 'TENANT')
ON CONFLICT (code) DO NOTHING;

-- B. Prevent duplicate mapping errors in role_permissions table before remapping
DELETE FROM role_permissions rp
WHERE rp.permission_id = (SELECT id FROM permissions WHERE code = 'tickets.view')
  AND rp.role_id IN (
      SELECT rp2.role_id FROM role_permissions rp2 
      WHERE rp2.permission_id = (SELECT id FROM permissions WHERE code = 'ticket.view')
  );

DELETE FROM role_permissions rp
WHERE rp.permission_id = (SELECT id FROM permissions WHERE code = 'tickets.create')
  AND rp.role_id IN (
      SELECT rp2.role_id FROM role_permissions rp2 
      WHERE rp2.permission_id = (SELECT id FROM permissions WHERE code = 'ticket.create')
  );

DELETE FROM role_permissions rp
WHERE rp.permission_id = (SELECT id FROM permissions WHERE code = 'tickets.update')
  AND rp.role_id IN (
      SELECT rp2.role_id FROM role_permissions rp2 
      WHERE rp2.permission_id = (SELECT id FROM permissions WHERE code = 'ticket.update')
  );

DELETE FROM role_permissions rp
WHERE rp.permission_id = (SELECT id FROM permissions WHERE code = 'tickets.assign')
  AND rp.role_id IN (
      SELECT rp2.role_id FROM role_permissions rp2 
      WHERE rp2.permission_id = (SELECT id FROM permissions WHERE code = 'ticket.assign')
  );

-- C. Remap all role_permissions references from tickets.xxx to ticket.xxx
UPDATE role_permissions 
SET permission_id = (SELECT id FROM permissions WHERE code = 'ticket.view')
WHERE permission_id = (SELECT id FROM permissions WHERE code = 'tickets.view');

UPDATE role_permissions 
SET permission_id = (SELECT id FROM permissions WHERE code = 'ticket.create')
WHERE permission_id = (SELECT id FROM permissions WHERE code = 'tickets.create');

UPDATE role_permissions 
SET permission_id = (SELECT id FROM permissions WHERE code = 'ticket.update')
WHERE permission_id = (SELECT id FROM permissions WHERE code = 'tickets.update');

UPDATE role_permissions 
SET permission_id = (SELECT id FROM permissions WHERE code = 'ticket.assign')
WHERE permission_id = (SELECT id FROM permissions WHERE code = 'tickets.assign');

-- D. Safely delete the legacy tickets.xxx permissions
DELETE FROM permissions WHERE code IN ('tickets.view', 'tickets.create', 'tickets.update', 'tickets.assign');

-- Step 4: Add new system-scoped permissions
INSERT INTO permissions (code, name, description, module, scope) VALUES
('system.tenants.create', 'CREATE TENANT', 'Allows creation of new tenant organizations', 'system', 'SYSTEM'),
('system.tenants.approve', 'APPROVE TENANT', 'Allows approval of self-service tenant registrations', 'system', 'SYSTEM'),
('system.tenants.suspend', 'SUSPEND TENANT', 'Allows temporary suspension of tenant organizations', 'system', 'SYSTEM'),
('system.contracts.view', 'VIEW CONTRACTS', 'Allows viewing tenant contract documents', 'system', 'SYSTEM'),
('system.contracts.upload', 'UPLOAD CONTRACTS', 'Allows uploading tenant contract documents', 'system', 'SYSTEM'),
('system.quotas.manage', 'MANAGE QUOTAS', 'Allows managing resource limits and user quotas for tenants', 'system', 'SYSTEM'),
('system.audit.view', 'VIEW SYSTEM AUDITS', 'Allows viewing system-wide security and audit logs', 'system', 'SYSTEM'),
('system.gis.manage', 'MANAGE GIS ENGINE', 'Allows managing global GIS engines, pollers, and map tile cache', 'system', 'SYSTEM'),
('system.billing.manage', 'MANAGE BILLING GATEWAY', 'Allows managing global payment gateways and SaaS billing', 'system', 'SYSTEM'),
('system.support.impersonate', 'IMPERSONATE TENANT', 'Allows logging into tenant dashboards for troubleshooting', 'system', 'SYSTEM')
ON CONFLICT (code) DO UPDATE SET 
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  module = EXCLUDED.module, 
  scope = EXCLUDED.scope;

-- Step 5: Insert and update System Roles with SYS- prefix
INSERT INTO roles (name, display_name, description, is_system_role, scope, code) VALUES
('super_admin', 'SUPER ADMIN', 'System Role: super_admin', true, 'SYSTEM', 'SYS-01'),
('system_support', 'SYSTEM SUPPORT', 'System Role: system_support', true, 'SYSTEM', 'SYS-02'),
('system_billing', 'SYSTEM BILLING', 'System Role: system_billing', true, 'SYSTEM', 'SYS-03'),
('account_manager', 'ACCOUNT MANAGER', 'System Role: account_manager', true, 'SYSTEM', 'SYS-04'),
('system_auditor', 'SYSTEM AUDITOR', 'System Role: system_auditor', true, 'SYSTEM', 'SYS-05'),
('platform_engineer', 'PLATFORM ENGINEER', 'System Role: platform_engineer', true, 'SYSTEM', 'SYS-06')
ON CONFLICT (name, organization_id) WHERE organization_id IS NULL DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_system_role = EXCLUDED.is_system_role,
  scope = EXCLUDED.scope,
  code = EXCLUDED.code;

-- Update existing tenant roles to have TENT- prefix codes
UPDATE roles SET code = 'TENT-01' WHERE name = 'admin' AND scope = 'TENANT';
UPDATE roles SET code = 'TENT-02' WHERE name = 'noc' AND scope = 'TENANT';
UPDATE roles SET code = 'TENT-03' WHERE name = 'surveyor' AND scope = 'TENANT';
UPDATE roles SET code = 'TENT-04' WHERE name = 'technician' AND scope = 'TENANT';
UPDATE roles SET code = 'TENT-05' WHERE name = 'finance' AND scope = 'TENANT';
UPDATE roles SET code = 'TENT-06' WHERE name = 'helpdesk' AND scope = 'TENANT';
UPDATE roles SET code = 'TENT-07' WHERE name = 'supervisor' AND scope = 'TENANT';
UPDATE roles SET code = 'TENT-08' WHERE name = 'warehouse' AND scope = 'TENANT';
UPDATE roles SET code = 'TENT-09' WHERE name = 'auditor' AND scope = 'TENANT';
UPDATE roles SET code = 'TENT-10' WHERE name = 'vendor' AND scope = 'TENANT';
UPDATE roles SET code = 'TENT-11' WHERE name = 'viewer' AND scope = 'TENANT';

-- Step 6: Map permissions to System Roles
-- Clean existing system mappings to avoid duplicates
DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE scope = 'SYSTEM');

-- A. super_admin gets all SYSTEM and TENANT permissions (using helper query)
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'super_admin' AND scope = 'SYSTEM'), id FROM permissions;

-- B. account_manager gets specific onboarding & contract permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'account_manager' AND scope = 'SYSTEM'), id 
FROM permissions 
WHERE code IN (
  'system.tenants.create', 'system.tenants.approve', 'system.tenants.suspend', 
  'system.contracts.view', 'system.contracts.upload', 'system.quotas.manage', 'orgs.view'
);

-- C. system_support gets impersonation and basic system view
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'system_support' AND scope = 'SYSTEM'), id 
FROM permissions 
WHERE code IN ('system.support.impersonate', 'orgs.view');

-- D. system_billing gets billing management
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'system_billing' AND scope = 'SYSTEM'), id 
FROM permissions 
WHERE code IN ('system.billing.manage');

-- E. system_auditor gets global audit viewing
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'system_auditor' AND scope = 'SYSTEM'), id 
FROM permissions 
WHERE code IN ('system.audit.view', 'orgs.view');

-- F. platform_engineer gets GIS core engine and poller management
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'platform_engineer' AND scope = 'SYSTEM'), id 
FROM permissions 
WHERE code IN ('system.gis.manage');
