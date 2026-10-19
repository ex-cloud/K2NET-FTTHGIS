-- ==============================================================================
-- Flyway Migration V62: Add Subscription Plan Dynamic Capacity Quota Columns
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
-- Eliminates hardcoded if-else Java tier checks in ProjectQuotaService and
-- OrganizationSubscriptionService by externalizing quotas directly to database.
-- ==============================================================================

-- 1. Tambahkan kolom kapasitas kuota pada tabel master subscription_plans
ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS max_olts INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS max_storage_gb INT DEFAULT 2,
    ADD COLUMN IF NOT EXISTS api_rate_limit_rpm INT DEFAULT 500;

-- 2. Tambahkan kolom kapasitas kuota pada tabel audit Hibernate Envers subscription_plans_aud
ALTER TABLE subscription_plans_aud
    ADD COLUMN IF NOT EXISTS max_olts INT,
    ADD COLUMN IF NOT EXISTS max_storage_gb INT,
    ADD COLUMN IF NOT EXISTS api_rate_limit_rpm INT;

-- 3. Backfill nilai kanonikal 4 tier aktif di platform
-- FREE (1 OLT, 2 GB Storage, 500 RPM)
UPDATE subscription_plans
SET max_olts = 1,
    max_storage_gb = 2,
    api_rate_limit_rpm = 500
WHERE name = 'FREE';

-- STARTER (2 OLTs, 15 GB Storage, 2.000 RPM)
UPDATE subscription_plans
SET max_olts = 2,
    max_storage_gb = 15,
    api_rate_limit_rpm = 2000
WHERE name = 'STARTER';

-- PRO (6 OLTs, 100 GB Storage, 8.000 RPM)
UPDATE subscription_plans
SET max_olts = 6,
    max_storage_gb = 100,
    api_rate_limit_rpm = 8000
WHERE name = 'PRO';

-- ENTERPRISE (25 OLTs, 500 GB Storage, 30.000 RPM)
UPDATE subscription_plans
SET max_olts = 25,
    max_storage_gb = 500,
    api_rate_limit_rpm = 30000
WHERE name = 'ENTERPRISE';

-- 4. Dokumentasi Kolom
COMMENT ON COLUMN subscription_plans.max_olts IS 'Kapasitas maksimum OLT / Core Network yang dapat didaftarkan tenant';
COMMENT ON COLUMN subscription_plans.max_storage_gb IS 'Kapasitas kuota penyimpanan S3 MinIO dalam Gigabytes (GB)';
COMMENT ON COLUMN subscription_plans.api_rate_limit_rpm IS 'Batas laju pemanggilan API gateway dalam Requests Per Minute (RPM)';
