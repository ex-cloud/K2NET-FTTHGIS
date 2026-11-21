-- ==============================================================================
-- Flyway Migration V87: Allow DISABLED Status in Platform Module Registry
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Goals:
--   1. Update platform_modules check constraint to include 'DISABLED'.
--   2. Maintain Envers parity by ensuring platform_modules_aud accepts 'DISABLED'.
-- ==============================================================================

ALTER TABLE platform_modules DROP CONSTRAINT IF EXISTS platform_modules_status_check;
ALTER TABLE platform_modules ADD CONSTRAINT platform_modules_status_check
    CHECK (status IN ('ACTIVE', 'IN_DEVELOPMENT', 'MAINTENANCE', 'DEPRECATED', 'DISABLED'));
