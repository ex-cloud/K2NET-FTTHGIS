-- ==============================================================================
-- Migration: V84__normalize_permission_modules.sql
-- Description: Enterprise data normalization for permissions and permissions_aud.
-- Eliminates legacy plurals, uppercase casing, and inconsistent module tags.
-- Strictly maintains Hibernate Envers audit table parity (permissions_aud).
-- ==============================================================================

-- 1. Normalize CUSTOMERS -> customer
UPDATE permissions 
SET module = 'customer', updated_at = NOW() 
WHERE LOWER(module) IN ('customers', 'customer') AND (module <> 'customer' OR module IS NULL);

UPDATE permissions_aud 
SET module = 'customer' 
WHERE LOWER(module) IN ('customers', 'customer') AND (module <> 'customer' OR module IS NULL);

-- 2. Normalize INTEGRATIONS -> integration
UPDATE permissions 
SET module = 'integration', updated_at = NOW() 
WHERE LOWER(module) IN ('integrations', 'integration') AND (module <> 'integration' OR module IS NULL);

UPDATE permissions_aud 
SET module = 'integration' 
WHERE LOWER(module) IN ('integrations', 'integration') AND (module <> 'integration' OR module IS NULL);

-- 3. Normalize organizations -> organization
UPDATE permissions 
SET module = 'organization', updated_at = NOW() 
WHERE LOWER(module) IN ('organizations', 'organization') AND (module <> 'organization' OR module IS NULL);

UPDATE permissions_aud 
SET module = 'organization' 
WHERE LOWER(module) IN ('organizations', 'organization') AND (module <> 'organization' OR module IS NULL);

-- 4. Normalize ROLES / role -> security
UPDATE permissions 
SET module = 'security', updated_at = NOW() 
WHERE LOWER(module) IN ('roles', 'role') AND (module <> 'security' OR module IS NULL);

UPDATE permissions_aud 
SET module = 'security' 
WHERE LOWER(module) IN ('roles', 'role') AND (module <> 'security' OR module IS NULL);

-- 5. Normalize tenants -> system
UPDATE permissions 
SET module = 'system', updated_at = NOW() 
WHERE LOWER(module) = 'tenants' AND (module <> 'system' OR module IS NULL);

UPDATE permissions_aud 
SET module = 'system' 
WHERE LOWER(module) = 'tenants' AND (module <> 'system' OR module IS NULL);

-- 6. Ensure all module names are strictly trimmed lowercase
UPDATE permissions 
SET module = LOWER(TRIM(module)), updated_at = NOW() 
WHERE module IS NOT NULL AND module <> LOWER(TRIM(module));

UPDATE permissions_aud 
SET module = LOWER(TRIM(module)) 
WHERE module IS NOT NULL AND module <> LOWER(TRIM(module));

