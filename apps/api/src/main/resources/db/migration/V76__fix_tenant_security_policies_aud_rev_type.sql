-- ==============================================================================
-- Flyway Migration V76: Fix rev column type in tenant_security_policies_aud
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Goals:
--   1. Alter rev column from BIGINT (int8) to INTEGER (int4) to match revinfo.id
--      and Hibernate Envers DefaultRevisionEntity schema validator.
--   2. Add foreign key constraint to revinfo(id).
-- ==============================================================================

-- 1. Alter rev column type to INTEGER
ALTER TABLE tenant_security_policies_aud
    ALTER COLUMN rev TYPE INTEGER;

-- 2. Add foreign key to revinfo(id) idempotently
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_tenant_security_policies_aud_rev'
    ) THEN
        ALTER TABLE tenant_security_policies_aud
            ADD CONSTRAINT fk_tenant_security_policies_aud_rev FOREIGN KEY (rev) REFERENCES revinfo(id);
    END IF;
END $$;
