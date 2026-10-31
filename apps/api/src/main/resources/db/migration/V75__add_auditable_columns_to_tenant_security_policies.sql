-- ==============================================================================
-- Flyway Migration V75: Add Auditable Columns to Tenant Security Policies
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Goals:
--   1. Add missing AuditableEntity columns (created_by, updated_by) to tenant_security_policies.
--   2. Add missing audit columns to tenant_security_policies_aud for Hibernate Envers.
-- ==============================================================================

-- 1. Add created_by and updated_by to tenant_security_policies
ALTER TABLE tenant_security_policies
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- 2. Add audit timestamp and user tracking columns to tenant_security_policies_aud
ALTER TABLE tenant_security_policies_aud
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
