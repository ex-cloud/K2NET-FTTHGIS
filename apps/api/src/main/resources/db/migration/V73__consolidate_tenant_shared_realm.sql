-- ==============================================================================
-- K2NET FTTH GIS — 2-Realm Consolidation (ftth-realm & k2net-tenants)
-- Migration: V73__consolidate_tenant_shared_realm.sql
-- ==============================================================================
-- Consolidates all ISP tenant organizations onto the single shared Keycloak realm
-- 'k2net-tenants', keeping only the sentinel platform organization on 'ftth-realm'.
-- Replaces the legacy 1:1 unique index on organizations.realm_key with a fast
-- non-unique lookup index so multiple tenants share 'k2net-tenants' cleanly.
-- ==============================================================================

-- 1. Drop legacy unique index / unique constraint on organizations.realm_key
DROP INDEX IF EXISTS uq_organizations_realm_key;

DO $$
DECLARE
    con_rec RECORD;
BEGIN
    FOR con_rec IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND t.relname = 'organizations'
          AND c.contype = 'u'
          AND pg_get_constraintdef(c.oid) ILIKE '%(realm_key)%'
    LOOP
        EXECUTE format('ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS %I', con_rec.conname);
    END LOOP;
END $$;

-- 2. Create non-unique index on organizations(realm_key)
CREATE INDEX IF NOT EXISTS idx_organizations_realm_key ON organizations(realm_key);

-- 3. Bind sentinel platform organization strictly to 'ftth-realm'
UPDATE organizations
SET realm_key = 'ftth-realm'
WHERE id = '00000000-0000-0000-0000-000000000001'
   OR slug = 'default';

-- 4. Bind all ISP tenant organizations to shared realm 'k2net-tenants'
UPDATE organizations
SET realm_key = 'k2net-tenants'
WHERE id <> '00000000-0000-0000-0000-000000000001'
  AND slug <> 'default';

-- 5. Synchronize Hibernate Envers audit table (organizations_aud)
DO $$
DECLARE
    con_rec RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations_aud') THEN
        -- 5a. Ensure realm_key column exists on audit table
        ALTER TABLE organizations_aud ADD COLUMN IF NOT EXISTS realm_key VARCHAR(255);

        -- 5b. Drop any legacy unique constraint on audit table if present
        FOR con_rec IN
            SELECT c.conname
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            JOIN pg_namespace n ON t.relnamespace = n.oid
            WHERE n.nspname = 'public'
              AND t.relname = 'organizations_aud'
              AND c.contype = 'u'
              AND pg_get_constraintdef(c.oid) ILIKE '%(realm_key)%'
        LOOP
            EXECUTE format('ALTER TABLE public.organizations_aud DROP CONSTRAINT IF EXISTS %I', con_rec.conname);
        END LOOP;

        -- 5c. Synchronize historical audit entries
        UPDATE organizations_aud
        SET realm_key = 'ftth-realm'
        WHERE (id = '00000000-0000-0000-0000-000000000001' OR slug = 'default')
          AND (realm_key IS NULL OR realm_key <> 'ftth-realm');

        UPDATE organizations_aud
        SET realm_key = 'k2net-tenants'
        WHERE id <> '00000000-0000-0000-0000-000000000001'
          AND slug <> 'default'
          AND (realm_key IS NULL OR realm_key <> 'k2net-tenants');
    END IF;
END $$;


