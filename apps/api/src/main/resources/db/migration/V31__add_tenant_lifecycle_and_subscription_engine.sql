-- ==============================================================================
-- K2NET FTTH GIS — B2B Tenant Lifecycle & Subscription Plan Engine
-- Migration: V31__add_tenant_lifecycle_and_subscription_engine.sql
-- ==============================================================================

-- 1. Alter organizations table with subscription lifecycle and booster columns
ALTER TABLE organizations 
    ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS grace_period_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS booster_odps INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS booster_olts INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS booster_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS dunning_level INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS plan_cycle VARCHAR(16) DEFAULT 'MONTHLY',
    ADD COLUMN IF NOT EXISTS over_quota_mode BOOLEAN DEFAULT FALSE;

-- 2. Add same columns to Hibernate Envers audit table if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations_aud') THEN
        ALTER TABLE organizations_aud 
            ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS grace_period_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS booster_odps INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS booster_olts INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS booster_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS dunning_level INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS plan_cycle VARCHAR(16) DEFAULT 'MONTHLY',
            ADD COLUMN IF NOT EXISTS over_quota_mode BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Create index for dunning and trial status lookups
CREATE INDEX IF NOT EXISTS idx_orgs_trial_expires ON organizations(trial_expires_at) WHERE trial_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orgs_dunning_level ON organizations(dunning_level) WHERE dunning_level > 0;
CREATE INDEX IF NOT EXISTS idx_orgs_booster_expires ON organizations(booster_expires_at) WHERE booster_expires_at IS NOT NULL;
