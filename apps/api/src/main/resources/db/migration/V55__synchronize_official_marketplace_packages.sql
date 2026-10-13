-- ==============================================================================
-- Flyway Migration V55: Synchronize Official Marketplace Add-on Packages
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
-- Quad-Engine Alignment: Differentiate Core Platform Modules vs 12 Marketplace Add-ons
-- ==============================================================================

-- 1. TRANSISI PKG_OLT_POLLER: Menjadi Core Platform Module (Bukan Add-on Marketplace)
-- Menjaga foreign key yang sudah ada, namun menonaktifkan publikasi dari marketplace katalog.
UPDATE platform_packages 
SET is_published = FALSE,
    sort_order = 99,
    metadata_json = jsonb_set(
        COALESCE(metadata_json, '{}'::jsonb), 
        '{system_notice}', 
        '"Modul OLT Live Telemetry & Monitoring telah bertransformasi menjadi Core Platform Module bawaan Subscription Plan."'
    )
WHERE code = 'PKG_OLT_POLLER';

-- 2. BERSIHKAN DEPENDENSI PREREQUISITE PKG_OLT_POLLER DARI PAKET TURUNAN
-- Karena OLT Telemetry adalah fitur bawaan, paket AI OTDR tidak lagi memblokir pembelian.
UPDATE platform_packages 
SET prerequisite_codes = '[]'::jsonb 
WHERE code IN ('PKG_AI_OTDR', 'PKG_PREDICTIVE_CAPACITY');

-- 3. SEMBUNYIKAN MODUL-MODUL YANG BERTARAF CORE TIER DARI MARKETPLACE
-- Fitur-fitur ini dikelola langsung via Subscription Plan / License Tiering
UPDATE platform_packages
SET is_published = FALSE, sort_order = 90
WHERE code IN (
    'PKG_MOBILE_TECH', 
    'PKG_ASBUILT_REDLINE', 
    'PKG_ADVANCED_RBAC', 
    'PKG_PREDICTIVE_CAPACITY', 
    'PKG_SUB_TENANT_HUB', 
    'PKG_HA_GEO_REPLICA', 
    'PKG_VENDOR_PORTAL', 
    'PKG_COVERAGE_WIDGET'
);

-- 4. UPSERT 12 RESMI ADD-ON MARKETPLACE (METADATA & QUOTA DELTA PRESISI)
INSERT INTO platform_packages (
    code, name, category, billing_type, price_monthly, min_plan_tier, 
    prerequisite_codes, conflict_codes, feature_key, quota_delta_json, 
    metadata_json, is_published, icon_name, badge_label, sort_order
)
VALUES
    -- 1. CAPACITY BOOSTERS
    ('PKG_BOOSTER_OLT_5', 'Micro-Booster +5 OLT Hardware Capacity', 'CAPACITY_BOOSTER', 'RECURRING_MONTHLY', 500000, 'FREE', '[]'::jsonb, '[]'::jsonb, NULL, '{"deltaOlts": 5}'::jsonb, '{"description": "Tambahan kapasitas instan +5 unit OLT hardware limit tanpa mengubah edisi paket langganan dasar."}'::jsonb, TRUE, 'Server', 'Booster', 1),
    ('PKG_BOOSTER_ODP_100', 'Micro-Booster +100 Splitter ODP Cluster', 'CAPACITY_BOOSTER', 'RECURRING_MONTHLY', 300000, 'FREE', '[]'::jsonb, '[]'::jsonb, NULL, '{"deltaOdps": 100}'::jsonb, '{"description": "Tambahan kuota instan +100 titik kotak splitter ODP aktif di peta spasial."}'::jsonb, TRUE, 'Cpu', 'Booster', 2),
    ('PKG_BOOSTER_STORAGE_50', 'Micro-Booster +50 GB MinIO S3 Media Storage', 'CAPACITY_BOOSTER', 'RECURRING_MONTHLY', 200000, 'FREE', '[]'::jsonb, '[]'::jsonb, NULL, '{"deltaStorageGb": 50}'::jsonb, '{"description": "Ekspansi ruang penyimpanan foto tiang dan as-built dokumen sebesar +50 GB."}'::jsonb, TRUE, 'HardDrive', 'Booster', 3),

    -- 2. THIRD-PARTY GATEWAY INTEGRATIONS
    ('PKG_WA_OUTAGE', 'WhatsApp Outage Broadcast Gateway', 'INTEGRATION', 'RECURRING_MONTHLY', 350000, 'STARTER', '[]'::jsonb, '[]'::jsonb, 'feature.notification.wa_blast', '{}'::jsonb, '{"description": "Blast notifikasi broadcast WhatsApp otomatis ke pelanggan terdampak di cluster kabel FO yang putus."}'::jsonb, TRUE, 'MessageSquare', 'Auto Alert', 4),
    ('PKG_OPEN_API', 'Developer REST API & Webhook Streamer Pack', 'INTEGRATION', 'RECURRING_MONTHLY', 750000, 'PRO', '[]'::jsonb, '[]'::jsonb, 'feature.integration.open_api', '{}'::jsonb, '{"description": "Akses Open API rate-limit tinggi (15.000 RPM) dan webhook event real-time ke billing Mikrotik/Radius tenant."}'::jsonb, TRUE, 'Terminal', 'Developer', 5),

    -- 3. DEEP TECH & OPTICAL AI
    ('PKG_AI_OTDR', 'AI Optical Fault & Cable Cut Localizer Pack', 'SPATIAL_AI', 'RECURRING_MONTHLY', 1250000, 'PRO', '[]'::jsonb, '[]'::jsonb, 'feature.gis.ai_otdr_localizer', '{}'::jsonb, '{"description": "Algoritma interpolasi OTDR cerdas memetakan jarak meter gangguan ke koordinat kabel putus presisi di peta GIS."}'::jsonb, TRUE, 'Zap', 'AI Powered', 6),
    ('PKG_AI_FTTH_DESIGNER', 'Automated Fiber Route & Splitter Auto-Planner', 'SPATIAL_AI', 'RECURRING_MONTHLY', 2000000, 'PRO', '[]'::jsonb, '[]'::jsonb, 'feature.gis.ai_route_planner', '{}'::jsonb, '{"description": "Optimasi rute kabel FO terpendek dan penempatan ODC/ODP otomatis dari data jalan OpenStreetMap untuk hemat Capex."}'::jsonb, TRUE, 'Compass', 'Smart Capex', 7),

    -- 4. STREAMING & IOT SENSORS
    ('PKG_SIEM_AUDIT', 'Advanced Forensic Audit & SIEM Exporter', 'SECURITY_GOV', 'RECURRING_MONTHLY', 1500000, 'PRO', '[]'::jsonb, '[]'::jsonb, 'feature.security.siem_exporter', '{}'::jsonb, '{"description": "Streaming log audit real-time format Syslog/CEF ke SIEM Splunk/Elasticsearch tenant dengan retensi jangka panjang."}'::jsonb, TRUE, 'ShieldAlert', 'ISO 27001', 8),
    ('PKG_IOT_ODC_GUARD', 'Smart ODC Microswitch & Flood Telemetry Pack', 'IOT_SENSORS', 'RECURRING_MONTHLY', 850000, 'STARTER', '[]'::jsonb, '[]'::jsonb, 'feature.iot.odc_guard', '{}'::jsonb, '{"description": "Ingest telemetri sensor IoT pintu ODC terbuka dan sensor banjir handhole di bawah tanah dengan alert visual di peta."}'::jsonb, TRUE, 'Radio', 'IoT Guard', 9),

    -- 5. LEGAL, COMPLIANCE & WHITELABEL
    ('PKG_PLN_ROW_PERMIT', 'Utility Pole & RoW Permit Management Pack', 'COMPLIANCE_ROW', 'RECURRING_MONTHLY', 600000, 'STARTER', '[]'::jsonb, '[]'::jsonb, 'feature.compliance.pole_permits', '{}'::jsonb, '{"description": "Manajemen izin sewa tiang PLN/Pemda per ruas jalan, kalkulasi retribusi tahunan, dan alarm pencegah pemotongan kabel."}'::jsonb, TRUE, 'FileText', 'Legal RoW', 10),
    ('PKG_TENANT_BRANDING', 'Full Custom Domain & Whitelabel Branding', 'WHITE_LABEL', 'ONE_TIME', 2500000, 'PRO', '[]'::jsonb, '[]'::jsonb, 'feature.branding.whitelabel', '{}'::jsonb, '{"description": "Custom domain portal (gis.isp.net), logo login khusus, kop surat faktur tenant, dan sertifikat SSL otomatis."}'::jsonb, TRUE, 'Globe', 'Whitelabel', 11),
    ('PKG_WHOLESALE_LEASED', 'B2B Dark Fiber & Duct Space Leasing Pack', 'INTEGRATION', 'RECURRING_MONTHLY', 3000000, 'ENTERPRISE', '[]'::jsonb, '[]'::jsonb, 'feature.commercial.dark_fiber', '{}'::jsonb, '{"description": "Pengelolaan kontrak sewa dark fiber optik dan sub-duct ke operator mitra B2B dengan penguncian core pada peta GIS."}'::jsonb, TRUE, 'Layers', 'B2B Leased', 12)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    billing_type = EXCLUDED.billing_type,
    price_monthly = EXCLUDED.price_monthly,
    min_plan_tier = EXCLUDED.min_plan_tier,
    prerequisite_codes = EXCLUDED.prerequisite_codes,
    conflict_codes = EXCLUDED.conflict_codes,
    feature_key = EXCLUDED.feature_key,
    quota_delta_json = EXCLUDED.quota_delta_json,
    metadata_json = EXCLUDED.metadata_json,
    is_published = EXCLUDED.is_published,
    icon_name = EXCLUDED.icon_name,
    badge_label = EXCLUDED.badge_label,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
