-- ==============================================================================
-- Flyway Migration V64: Set Marketplace Engine DoD Lifecycle Status
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Normalizes the 21-package catalog into explicit lifecycle states:
-- 1. PUBLISHED (6 SKUs): Fully compliant with 5-layer DoD and backed by real engines.
-- 2. DRAFT (6 SKUs): Defined in catalog but awaiting engine implementation (Sprint 5).
-- 3. CORE_BUNDLED (9 packages): Core platform baseline features bundled with plans.
-- ==============================================================================

-- 1. Setel 6 SKU kanonikal yang memiliki engine aktif & lulus DoD menjadi PUBLISHED
UPDATE platform_packages
SET is_published = TRUE,
    lifecycle_status = 'PUBLISHED',
    updated_at = NOW(),
    updated_by = 'SYSTEM_MIGRATION_V64'
WHERE code IN (
    'PKG_BOOSTER_OLT_5',
    'PKG_BOOSTER_ODP_100',
    'PKG_BOOSTER_STORAGE_50',
    'PKG_OPEN_API',
    'PKG_TENANT_BRANDING',
    'PKG_WA_OUTAGE'
);

-- Normalisasi quota_delta_json untuk capacity boosters agar presisi sesuai kontrak Quad-Engine
UPDATE platform_packages
SET quota_delta_json = '{"deltaOlts": 5}'::jsonb
WHERE code = 'PKG_BOOSTER_OLT_5';

UPDATE platform_packages
SET quota_delta_json = '{"deltaOdps": 100}'::jsonb
WHERE code = 'PKG_BOOSTER_ODP_100';

UPDATE platform_packages
SET quota_delta_json = '{"deltaStorageGb": 50}'::jsonb
WHERE code = 'PKG_BOOSTER_STORAGE_50';

-- 2. Setel 6 SKU yang belum memiliki engine aktif menjadi DRAFT (unpublished)
-- Mencegah transaksi "janji palsu" sebelum engine selesai di Sprint 5
UPDATE platform_packages
SET is_published = FALSE,
    lifecycle_status = 'DRAFT',
    updated_at = NOW(),
    updated_by = 'SYSTEM_MIGRATION_V64'
WHERE code IN (
    'PKG_AI_OTDR',
    'PKG_AI_FTTH_DESIGNER',
    'PKG_SIEM_AUDIT',
    'PKG_IOT_ODC_GUARD',
    'PKG_PLN_ROW_PERMIT',
    'PKG_WHOLESALE_LEASED'
);

-- 3. Pastikan 9 paket bawaan plan berstatus CORE_BUNDLED (unpublished)
UPDATE platform_packages
SET is_published = FALSE,
    lifecycle_status = 'CORE_BUNDLED',
    updated_at = NOW(),
    updated_by = 'SYSTEM_MIGRATION_V64'
WHERE code IN (
    'PKG_VENDOR_PORTAL',
    'PKG_HA_GEO_REPLICA',
    'PKG_ASBUILT_REDLINE',
    'PKG_MOBILE_TECH',
    'PKG_COVERAGE_WIDGET',
    'PKG_ADVANCED_RBAC',
    'PKG_PREDICTIVE_CAPACITY',
    'PKG_OLT_POLLER',
    'PKG_SUB_TENANT_HUB'
);

-- 4. Dokumentasi tabel & status siklus hidup
COMMENT ON COLUMN platform_packages.lifecycle_status IS 'Status siklus hidup katalog: PUBLISHED (jual aktif di tenant), DRAFT (dalam pengembangan engine), CORE_BUNDLED (bawaan plan), DEPRECATED (usang)';
