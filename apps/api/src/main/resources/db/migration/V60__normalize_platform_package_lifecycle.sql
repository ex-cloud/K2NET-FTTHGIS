-- ==============================================================================
-- Flyway Migration V60: Normalize Platform Package Lifecycle Status & Marketplace 12 SKU
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
-- Standardizes package lifecycle (PUBLISHED, CORE_BUNDLED, DRAFT, DEPRECATED)
-- Resolves data drift on PKG_BOOSTER_OLT_5 to guarantee exact 12 published marketplace SKUs
-- ==============================================================================

-- 1. Tambah kolom lifecycle_status pada tabel platform_packages
ALTER TABLE platform_packages
    ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(30) NOT NULL DEFAULT 'PUBLISHED';

-- 2. Tambah kolom lifecycle_status pada tabel audit Envers (nullable)
ALTER TABLE platform_packages_aud
    ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(30);

-- 3. Tambahkan check constraint untuk validasi status siklus hidup
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_platform_packages_lifecycle_status'
    ) THEN
        ALTER TABLE platform_packages
            ADD CONSTRAINT chk_platform_packages_lifecycle_status
            CHECK (lifecycle_status IN ('PUBLISHED', 'CORE_BUNDLED', 'DRAFT', 'DEPRECATED'));
    END IF;
END $$;

-- 4. Kunci 12 SKU Resmi Marketplace: set is_published = TRUE & lifecycle_status = 'PUBLISHED'
UPDATE platform_packages
SET is_published = TRUE,
    lifecycle_status = 'PUBLISHED',
    updated_at = NOW()
WHERE code IN (
    'PKG_BOOSTER_OLT_5',
    'PKG_BOOSTER_ODP_100',
    'PKG_BOOSTER_STORAGE_50',
    'PKG_WA_OUTAGE',
    'PKG_OPEN_API',
    'PKG_AI_OTDR',
    'PKG_AI_FTTH_DESIGNER',
    'PKG_SIEM_AUDIT',
    'PKG_IOT_ODC_GUARD',
    'PKG_PLN_ROW_PERMIT',
    'PKG_TENANT_BRANDING',
    'PKG_WHOLESALE_LEASED'
);

-- 5. Kunci 9 Modul Core Platform: set is_published = FALSE & lifecycle_status = 'CORE_BUNDLED'
UPDATE platform_packages
SET is_published = FALSE,
    lifecycle_status = 'CORE_BUNDLED',
    updated_at = NOW()
WHERE code IN (
    'PKG_OLT_POLLER',
    'PKG_HA_GEO_REPLICA',
    'PKG_SUB_TENANT_HUB',
    'PKG_PREDICTIVE_CAPACITY',
    'PKG_ADVANCED_RBAC',
    'PKG_COVERAGE_WIDGET',
    'PKG_MOBILE_TECH',
    'PKG_ASBUILT_REDLINE',
    'PKG_VENDOR_PORTAL'
);
