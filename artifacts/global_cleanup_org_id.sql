-- GLOBAL CLEANUP: Remove 'org_id' from ALL tenant-aware tables if 'organization_id' already exists
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'org_id' 
        AND table_schema = 'public'
    ) LOOP
        -- If BOTH columns exist in this table, drop the old one
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = r.table_name AND column_name = 'organization_id') THEN
            RAISE NOTICE 'Dropping obsolete column org_id from table %', r.table_name;
            EXECUTE format('ALTER TABLE %I DROP COLUMN org_id', r.table_name);
        END IF;
    END LOOP;
END $$;
