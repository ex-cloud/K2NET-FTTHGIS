-- FINAL CLEANUP: Remove the duplicate and conflicting 'org_id' column
DO $$ 
BEGIN
    -- If BOTH columns exist, we can safely drop 'org_id' because 'organization_id' is what the code uses
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organization_configs' AND column_name='org_id') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organization_configs' AND column_name='organization_id') THEN
        RAISE NOTICE 'Dropping duplicate column org_id from organization_configs';
        ALTER TABLE organization_configs DROP COLUMN org_id;
    END IF;
END $$;
