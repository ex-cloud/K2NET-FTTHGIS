-- FIX: Standardizing 'organization_configs' table
DO $$ 
BEGIN
    -- 1. If 'org_id' exists, rename it to 'organization_id'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organization_configs' AND column_name='org_id') THEN
        RAISE NOTICE 'Renaming org_id to organization_id in organization_configs';
        ALTER TABLE organization_configs RENAME COLUMN org_id TO organization_id;
    END IF;
END $$;
