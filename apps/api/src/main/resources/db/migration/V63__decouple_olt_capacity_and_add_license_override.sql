-- ==============================================================================
-- Flyway Migration V63: Decouple OLT Capacity and Add License Override
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
-- Enables multi-OLT support per project across real-world ISP deployment scenarios
-- and adds custom OLT quota override capability to tenant licenses.
-- ==============================================================================

-- 1. Penyesuaian Rasio Kapasitas OLT Multi-Skenario pada Master Subscription Plans
-- FREE: 1 Project, 1 OLT
UPDATE subscription_plans
SET max_projects = 1,
    max_olts = 1
WHERE name = 'FREE';

-- STARTER: 2 Projects, 3 OLTs (Primary + Secondary Redundant HA)
UPDATE subscription_plans
SET max_projects = 2,
    max_olts = 3
WHERE name = 'STARTER';

-- PRO: 6 Projects, 12 OLTs (Rata-rata 2 OLT per cluster wilayah)
UPDATE subscription_plans
SET max_projects = 6,
    max_olts = 12
WHERE name = 'PRO';

-- ENTERPRISE: 25 Projects, 60 OLTs (Multi-chassis OLT per metro rollout)
UPDATE subscription_plans
SET max_projects = 25,
    max_olts = 60
WHERE name = 'ENTERPRISE';

-- 2. Tambahkan Kolom override_max_olts pada Tabel Kontrak Lisensi Tenant
ALTER TABLE tenant_licenses
    ADD COLUMN IF NOT EXISTS override_max_olts INT;

-- 3. Tambahkan Kolom override_max_olts pada Tabel Audit Envers
ALTER TABLE tenant_licenses_aud
    ADD COLUMN IF NOT EXISTS override_max_olts INT;

-- 4. Dokumentasi Kolom
COMMENT ON COLUMN tenant_licenses.override_max_olts IS 'Kustomisasi batas maksimum OLT hardware fisik khusus kontrak B2B organisasi ini';
