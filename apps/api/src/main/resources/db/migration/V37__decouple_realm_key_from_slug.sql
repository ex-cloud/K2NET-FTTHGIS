-- ==============================================================================
-- K2NET FTTH GIS — Decouple realm_key (Immutable) from slug (Mutable)
-- Migration: V37__decouple_realm_key_from_slug.sql
-- ==============================================================================

-- 1. Add realm_key column to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS realm_key VARCHAR(255);

-- 2. Backfill: untuk tenant yang sudah ada, realm_key diisi persis dengan slug eksisting
-- sehingga realm Keycloak yang sudah terpasang tidak perlu diubah sama sekali.
UPDATE organizations 
SET realm_key = slug 
WHERE realm_key IS NULL;

-- 3. Set NOT NULL dan buat UNIQUE constraint
ALTER TABLE organizations ALTER COLUMN realm_key SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_organizations_realm_key ON organizations(realm_key);

-- 4. Update Envers audit table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations_aud') THEN
        ALTER TABLE organizations_aud ADD COLUMN IF NOT EXISTS realm_key VARCHAR(255);
    END IF;
END $$;
