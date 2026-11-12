-- ==============================================================================
-- Flyway Migration V83: Tenant Security Policy Social Login Governance
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Goals:
--   1. Add allow_social_login column to tenant_security_policies (DEFAULT FALSE).
--   2. Add allow_social_login column to tenant_security_policies_aud for Hibernate Envers.
--   3. Backfill ops organization so operational root workspace retains social login.
-- ==============================================================================

-- 1. Alter tenant_security_policies Table
ALTER TABLE tenant_security_policies 
ADD COLUMN IF NOT EXISTS allow_social_login BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Alter Envers Audit Table (tenant_security_policies_aud)
ALTER TABLE tenant_security_policies_aud 
ADD COLUMN IF NOT EXISTS allow_social_login BOOLEAN;

-- 3. Backfill ops root workspace to retain active social login (Google & GitHub)
UPDATE tenant_security_policies 
SET allow_social_login = TRUE 
WHERE organization_id IN (
    SELECT id FROM organizations 
    WHERE slug = 'ops' OR is_platform_root = TRUE
);

