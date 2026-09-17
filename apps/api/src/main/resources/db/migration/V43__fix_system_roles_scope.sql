-- V43__fix_system_roles_scope.sql
-- Fix scope for internal system roles and normalize display names

-- 1. Ensure all 6 internal platform roles have scope = 'SYSTEM' and proper SYS- codes
UPDATE roles 
SET scope = 'SYSTEM', 
    is_system_role = true,
    code = 'SYS-01',
    display_name = 'SUPER ADMIN'
WHERE name = 'super_admin' AND organization_id IS NULL;

UPDATE roles 
SET scope = 'SYSTEM', 
    is_system_role = true,
    code = 'SYS-02',
    display_name = 'SYSTEM SUPPORT'
WHERE name = 'system_support' AND organization_id IS NULL;

UPDATE roles 
SET scope = 'SYSTEM', 
    is_system_role = true,
    code = 'SYS-03',
    display_name = 'SYSTEM BILLING'
WHERE name = 'system_billing' AND organization_id IS NULL;

UPDATE roles 
SET scope = 'SYSTEM', 
    is_system_role = true,
    code = 'SYS-04',
    display_name = 'ACCOUNT MANAGER'
WHERE name = 'account_manager' AND organization_id IS NULL;

UPDATE roles 
SET scope = 'SYSTEM', 
    is_system_role = true,
    code = 'SYS-05',
    display_name = 'SYSTEM AUDITOR'
WHERE name = 'system_auditor' AND organization_id IS NULL;

UPDATE roles 
SET scope = 'SYSTEM', 
    is_system_role = true,
    code = 'SYS-06',
    display_name = 'PLATFORM ENGINEER'
WHERE name = 'platform_engineer' AND organization_id IS NULL;

-- 2. Normalize display name for tenant supervisor template
UPDATE roles
SET display_name = 'SUPERVISOR',
    code = 'TENT-07'
WHERE name = 'supervisor' AND scope = 'TENANT' AND organization_id IS NULL;
