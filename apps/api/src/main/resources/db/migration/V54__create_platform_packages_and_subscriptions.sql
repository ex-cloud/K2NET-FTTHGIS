-- ==============================================================================
-- Flyway Migration V54: Create Platform Packages & Tenant Package Subscriptions
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
-- Quad-Engine Pillar 4: Packages & Add-on Marketplace
-- ==============================================================================

-- 1. TABEL MASTER KATALOG PAKET PLATFORM (DIMENSI SISTEM / CONTROL PLANE)
CREATE TABLE IF NOT EXISTS platform_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL UNIQUE,          -- Kode unik kanonikal, e.g. PKG_OLT_POLLER, PKG_AI_OTDR
    name VARCHAR(255) NOT NULL,                 -- Nama resmi paket
    category VARCHAR(64) NOT NULL,              -- TELEMETRY, FIELD_OPS, INTEGRATION, CAPACITY_BOOSTER, SECURITY_GOV, SPATIAL_AI, WHITE_LABEL, DISASTER_RECOVERY, COMPLIANCE_ROW, CONTRACTOR_OPS, SALES_EXPANSION, IOT_SENSORS
    billing_type VARCHAR(32) NOT NULL DEFAULT 'RECURRING_MONTHLY', -- RECURRING_MONTHLY, ONE_TIME
    price_monthly NUMERIC(15,2) NOT NULL DEFAULT 0,
    min_plan_tier VARCHAR(32) NOT NULL DEFAULT 'FREE', -- Validasi Lapis 1: FREE, STARTER, PRO, ENTERPRISE
    prerequisite_codes JSONB NOT NULL DEFAULT '[]'::jsonb, -- Validasi Lapis 3: ['PKG_OLT_POLLER']
    conflict_codes JSONB NOT NULL DEFAULT '[]'::jsonb,     -- Paket bertolak belakang yang tidak boleh aktif bersamaan
    feature_key VARCHAR(128) DEFAULT NULL,      -- Entitlement key: e.g. feature.telemetry.olt_poller
    quota_delta_json JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {"deltaOlts": 5, "deltaOdps": 100, "deltaStorageGb": 50}
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT TRUE, -- Flag tampil di Marketplace tenant
    icon_name VARCHAR(64) DEFAULT 'Package',
    badge_label VARCHAR(64) DEFAULT NULL,       -- 'Popular', 'Enterprise', 'Recommended', 'AI Powered'
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255)
);

-- 2. TABEL AUDIT ENVERS MASTER PAKET (HIBERNATE ENVERS AUDITING)
CREATE TABLE IF NOT EXISTS platform_packages_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    code VARCHAR(64),
    name VARCHAR(255),
    category VARCHAR(64),
    billing_type VARCHAR(32),
    price_monthly NUMERIC(15,2),
    min_plan_tier VARCHAR(32),
    prerequisite_codes JSONB,
    conflict_codes JSONB,
    feature_key VARCHAR(128),
    quota_delta_json JSONB,
    metadata_json JSONB,
    is_published BOOLEAN,
    icon_name VARCHAR(64),
    badge_label VARCHAR(64),
    sort_order INT,
    created_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(255),
    PRIMARY KEY (rev, id)
);

-- 3. TABEL LANGGANAN PAKET ADD-ON TENANT (DIMENSI OPERASIONAL TENANT / APPLICATION PLANE)
CREATE TABLE IF NOT EXISTS tenant_package_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES platform_packages(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, TRIAL, CANCELLED
    granted_by VARCHAR(64) NOT NULL DEFAULT 'PAYMENT_GATEWAY', -- PAYMENT_GATEWAY, ADMIN_MANUAL
    grant_notes TEXT DEFAULT NULL,
    activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- NULL jika ONE_TIME permanen
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    last_invoice_id UUID REFERENCES billing_invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255)
);

-- 4. TABEL AUDIT ENVERS LANGGANAN PAKET TENANT
CREATE TABLE IF NOT EXISTS tenant_package_subscriptions_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    organization_id UUID,
    package_id UUID,
    status VARCHAR(32),
    granted_by VARCHAR(64),
    grant_notes TEXT,
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN,
    last_invoice_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(255),
    PRIMARY KEY (rev, id)
);

-- 5. INDEKS PERFORMA & TENANT ISOLATION
CREATE INDEX IF NOT EXISTS idx_platform_packages_code ON platform_packages(code);
CREATE INDEX IF NOT EXISTS idx_platform_packages_category ON platform_packages(category, is_published);
CREATE INDEX IF NOT EXISTS idx_platform_packages_tier ON platform_packages(min_plan_tier);

CREATE INDEX IF NOT EXISTS idx_tenant_pkg_sub_org_status ON tenant_package_subscriptions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_pkg_sub_expires ON tenant_package_subscriptions(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_tenant_pkg_sub_pkg ON tenant_package_subscriptions(package_id);

-- 6. REGISTRASI GRANULAR PBAC PERMISSIONS (Scope: SYSTEM & TENANT)
INSERT INTO permissions (code, name, module, scope, description, created_at, updated_at) VALUES
    ('system.packages.view', 'View Platform Packages Master', 'packages', 'SYSTEM', 'Melihat master katalog paket add-on dan metrik adopsi tenant', NOW(), NOW()),
    ('system.packages.manage', 'Manage Platform Packages Master', 'packages', 'SYSTEM', 'Mengelola master paket, toggle publikasi, harga, dan manual grant POC', NOW(), NOW()),
    ('billing.packages.view', 'View Tenant Subscribed Packages', 'billing', 'TENANT', 'Melihat daftar paket add-on aktif dan katalog marketplace tenant', NOW(), NOW()),
    ('billing.packages.subscribe', 'Subscribe Tenant Marketplace Packages', 'billing', 'TENANT', 'Membeli dan memperpanjang langganan paket add-on marketplace', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Mapping SYSTEM permissions ke super_admin & platform_admin
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE p.code IN ('system.packages.view', 'system.packages.manage')
  AND r.name IN ('super_admin', 'platform_admin')
ON CONFLICT DO NOTHING;

-- Mapping TENANT permissions ke super_admin, admin, finance
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE p.code IN ('billing.packages.view', 'billing.packages.subscribe')
  AND r.name IN ('super_admin', 'admin', 'finance')
ON CONFLICT DO NOTHING;

-- 7. SEED DATA KATALOG 12 KATEGORI MASTER PACKAGES (STANDAR TELCO & ENTERPRISE)
INSERT INTO platform_packages (code, name, category, billing_type, price_monthly, min_plan_tier, prerequisite_codes, conflict_codes, feature_key, quota_delta_json, metadata_json, is_published, icon_name, badge_label, sort_order)
VALUES
    -- 1. TELEMETRY
    ('PKG_OLT_POLLER', 'OLT Live Telemetry & Optical Monitoring Pack', 'TELEMETRY', 'RECURRING_MONTHLY', 450000, 'STARTER', '[]'::jsonb, '[]'::jsonb, 'feature.telemetry.olt_poller', '{}'::jsonb, '{"description": "SNMP & SSH live polling untuk telemetri OLT, status Rx/Tx dBm per port PON, dan alarm ONT LOS massal."}'::jsonb, TRUE, 'Activity', 'Popular', 1),
    ('PKG_AI_OTDR', 'AI Optical Fault & Cable Cut Localizer Pack', 'TELEMETRY', 'RECURRING_MONTHLY', 1250000, 'PRO', '["PKG_OLT_POLLER"]'::jsonb, '[]'::jsonb, 'feature.gis.ai_otdr_localizer', '{}'::jsonb, '{"description": "Algoritma interpolasi OTDR cerdas memetakan jarak meter gangguan ke koordinat kabel putus presisi di peta GIS."}'::jsonb, TRUE, 'Zap', 'AI Powered', 2),

    -- 2. FIELD_OPS
    ('PKG_MOBILE_TECH', 'Mobile Field Technician & Offline GIS Pack', 'FIELD_OPS', 'RECURRING_MONTHLY', 350000, 'STARTER', '[]'::jsonb, '[]'::jsonb, 'feature.mobility.field_technician', '{}'::jsonb, '{"description": "Aplikasi teknisi tiang dengan peta vector offline di area blank spot dan pemindaian barcode QR FAT/ODP."}'::jsonb, TRUE, 'Smartphone', 'Field Essential', 3),
    ('PKG_ASBUILT_REDLINE', 'As-Built Redline & Photo Verification Pack', 'FIELD_OPS', 'RECURRING_MONTHLY', 400000, 'STARTER', '[]'::jsonb, '[]'::jsonb, 'feature.gis.asbuilt_redline', '{}'::jsonb, '{"description": "Alat coretan revisi konstruksi FO langsung di peta GIS, bukti foto geotagged, dan alur approval mandor."}'::jsonb, TRUE, 'Edit3', 'BoQ Audit', 4),

    -- 3. INTEGRATION
    ('PKG_WA_OUTAGE', 'WhatsApp Outage Broadcast Gateway', 'INTEGRATION', 'RECURRING_MONTHLY', 300000, 'STARTER', '[]'::jsonb, '[]'::jsonb, 'feature.notification.wa_blast', '{}'::jsonb, '{"description": "Blast notifikasi broadcast WhatsApp otomatis ke pelanggan terdampak di cluster kabel FO yang putus."}'::jsonb, TRUE, 'MessageSquare', 'Auto Alert', 5),
    ('PKG_OPEN_API', 'Developer REST API & Webhook Streamer Pack', 'INTEGRATION', 'RECURRING_MONTHLY', 750000, 'PRO', '[]'::jsonb, '[]'::jsonb, 'feature.integration.open_api', '{}'::jsonb, '{"description": "Akses Open API rate-limit tinggi (15.000 RPM) dan webhook event real-time ke billing Mikrotik/Radius tenant."}'::jsonb, TRUE, 'Terminal', 'Developer', 6),

    -- 4. CAPACITY_BOOSTER
    ('PKG_BOOSTER_OLT_5', 'Micro-Booster +5 OLT Hardware Capacity', 'CAPACITY_BOOSTER', 'RECURRING_MONTHLY', 500000, 'FREE', '[]'::jsonb, '[]'::jsonb, NULL, '{"deltaOlts": 5}'::jsonb, '{"description": "Tambahan kapasitas instan +5 unit OLT hardware limit tanpa mengubah edisi paket langganan dasar."}'::jsonb, TRUE, 'Server', 'Booster', 7),
    ('PKG_BOOSTER_ODP_100', 'Micro-Booster +100 Splitter ODP Cluster', 'CAPACITY_BOOSTER', 'RECURRING_MONTHLY', 300000, 'FREE', '[]'::jsonb, '[]'::jsonb, NULL, '{"deltaOdps": 100}'::jsonb, '{"description": "Tambahan kuota instan +100 titik kotak splitter ODP aktif di peta spasial."}'::jsonb, TRUE, 'Cpu', 'Booster', 8),
    ('PKG_BOOSTER_STORAGE_50', 'Micro-Booster +50 GB MinIO S3 Media Storage', 'CAPACITY_BOOSTER', 'RECURRING_MONTHLY', 200000, 'FREE', '[]'::jsonb, '[]'::jsonb, NULL, '{"deltaStorageGb": 50}'::jsonb, '{"description": "Ekspansi ruang penyimpanan foto tiang dan as-built dokumen sebesar +50 GB."}'::jsonb, TRUE, 'HardDrive', 'Booster', 9),

    -- 5. SECURITY_GOV
    ('PKG_SIEM_AUDIT', 'Advanced Forensic Audit & SIEM Exporter', 'SECURITY_GOV', 'RECURRING_MONTHLY', 1500000, 'PRO', '[]'::jsonb, '[]'::jsonb, 'feature.security.siem_exporter', '{}'::jsonb, '{"description": "Streaming log audit real-time format Syslog/CEF ke SIEM Splunk/Elasticsearch tenant dengan retensi 3 tahun."}'::jsonb, TRUE, 'ShieldAlert', 'ISO 27001', 10),
    ('PKG_ADVANCED_RBAC', 'Granular PBAC & Custom Role Builder', 'SECURITY_GOV', 'RECURRING_MONTHLY', 800000, 'PRO', '[]'::jsonb, '[]'::jsonb, 'feature.security.granular_rbac', '{}'::jsonb, '{"description": "Pembuatan peran custom tak terbatas dengan kontrol izin spesifik hingga level atribut dan wilayah wilayah GIS."}'::jsonb, TRUE, 'Lock', 'Enterprise', 11),

    -- 6. SPATIAL_AI
    ('PKG_AI_FTTH_DESIGNER', 'Automated Fiber Route & Splitter Auto-Planner', 'SPATIAL_AI', 'RECURRING_MONTHLY', 2000000, 'PRO', '[]'::jsonb, '[]'::jsonb, 'feature.gis.ai_route_planner', '{}'::jsonb, '{"description": "Optimasi rute kabel FO terpendek dan penempatan ODC/ODP otomatis dari data jalan OpenStreetMap untuk hemat Capex."}'::jsonb, TRUE, 'Compass', 'Smart Capex', 12),
    ('PKG_PREDICTIVE_CAPACITY', 'AI Churn & Capacity Exhaustion Predictor', 'SPATIAL_AI', 'RECURRING_MONTHLY', 1100000, 'PRO', '["PKG_OLT_POLLER"]'::jsonb, '[]'::jsonb, 'feature.analytics.predictive_capacity', '{}'::jsonb, '{"description": "Prediksi tanggal port ODP penuh dan penurunan redaman optik sebelum terjadi komplain pelanggan."}'::jsonb, TRUE, 'TrendingUp', 'Predictive', 13),

    -- 7. WHITE_LABEL
    ('PKG_TENANT_BRANDING', 'Full Custom Domain & Whitelabel Branding', 'WHITE_LABEL', 'ONE_TIME', 2500000, 'PRO', '[]'::jsonb, '[]'::jsonb, 'feature.branding.whitelabel', '{}'::jsonb, '{"description": "Custom domain portal (gis.isp.net), logo login khusus, kop surat faktur tenant, dan sertifikat SSL otomatis."}'::jsonb, TRUE, 'Globe', 'Whitelabel', 14),
    ('PKG_SUB_TENANT_HUB', 'Franchise & Reseller Sub-Tenant Partitioning', 'WHITE_LABEL', 'RECURRING_MONTHLY', 3500000, 'ENTERPRISE', '[]'::jsonb, '[]'::jsonb, 'feature.organization.sub_tenant_hub', '{}'::jsonb, '{"description": "Pemisahan workspace menjadi sub-tenant untuk mitra ISP lokal/reseller dengan isolasi data spasial ketat."}'::jsonb, TRUE, 'Layers', 'Multi-ISP', 15),

    -- 8. DISASTER_RECOVERY
    ('PKG_HA_GEO_REPLICA', 'Dedicated Standby Database & Cross-Region Sync', 'DISASTER_RECOVERY', 'RECURRING_MONTHLY', 4500000, 'ENTERPRISE', '[]'::jsonb, '[]'::jsonb, 'feature.infrastructure.ha_geo_replica', '{}'::jsonb, '{"description": "Database read-replica terdedikasi dan sinkronisasi S3 pribadi milik tenant dengan jaminan RPO < 5 menit."}'::jsonb, TRUE, 'Database', 'HA Standby', 16),

    -- 9. COMPLIANCE_ROW
    ('PKG_PLN_ROW_PERMIT', 'Utility Pole & RoW Permit Management Pack', 'COMPLIANCE_ROW', 'RECURRING_MONTHLY', 600000, 'STARTER', '[]'::jsonb, '[]'::jsonb, 'feature.compliance.pole_permits', '{}'::jsonb, '{"description": "Manajemen izin sewa tiang PLN/Pemda per ruas jalan, kalkulasi retribusi tahunan, dan alarm pencegah pemotongan kabel."}'::jsonb, TRUE, 'FileText', 'Legal RoW', 17),

    -- 10. CONTRACTOR_OPS
    ('PKG_VENDOR_PORTAL', 'Contractor Job-Order & BoQ Opname Pack', 'CONTRACTOR_OPS', 'RECURRING_MONTHLY', 700000, 'STARTER', '[]'::jsonb, '[]'::jsonb, 'feature.vendor.contractor_portal', '{}'::jsonb, '{"description": "Portal mandor pihak ketiga untuk klaim penarikan kabel di peta, dokumentasi opname fisik, dan audit BoQ otomatis."}'::jsonb, TRUE, 'Users', 'Subcon', 18),

    -- 11. SALES_EXPANSION
    ('PKG_COVERAGE_WIDGET', 'Public Coverage Embed Widget & Lead Generation', 'SALES_EXPANSION', 'RECURRING_MONTHLY', 500000, 'STARTER', '[]'::jsonb, '[]'::jsonb, 'feature.sales.coverage_checker', '{}'::jsonb, '{"description": "Widget sematan situs publik untuk calon pelanggan cek jangkauan fiber < 150m dari ODP dan integrasi pendaftaran langsung."}'::jsonb, TRUE, 'MapPin', 'Lead Gen', 19),

    -- 12. IOT_SENSORS
    ('PKG_IOT_ODC_GUARD', 'Smart ODC Microswitch & Flood Telemetry Pack', 'IOT_SENSORS', 'RECURRING_MONTHLY', 850000, 'STARTER', '[]'::jsonb, '[]'::jsonb, 'feature.iot.odc_guard', '{}'::jsonb, '{"description": "Ingest telemetri sensor IoT pintu ODC terbuka dan sensor banjir handhole di bawah tanah dengan alert visual di peta."}'::jsonb, TRUE, 'Radio', 'IoT Guard', 20)
ON CONFLICT (code) DO NOTHING;
