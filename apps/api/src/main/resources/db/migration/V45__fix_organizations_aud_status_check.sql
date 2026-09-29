-- ============================================================
-- Flyway Migration V45: Fix organizations_aud status check constraint
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
-- ============================================================

-- 1. Drop outdated status check constraint on Envers audit table
ALTER TABLE organizations_aud 
    DROP CONSTRAINT IF EXISTS organizations_aud_status_check;

-- 2. Re-create constraint with all valid OrganizationStatus enum values
ALTER TABLE organizations_aud 
    ADD CONSTRAINT organizations_aud_status_check 
    CHECK (status::text = ANY (ARRAY[
        'ACTIVE'::text, 
        'TRIAL'::text, 
        'PENDING_APPROVAL'::text, 
        'OVERDUE'::text, 
        'OVER_QUOTA'::text, 
        'SUSPENDED'::text, 
        'TRIAL_EXPIRED'::text, 
        'DELETED'::text
    ]));
