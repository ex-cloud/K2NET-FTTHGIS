-- ==============================================================================
-- Flyway Migration V66: 3-Domain Data Model (Catalog, Billing & Subscriptions)
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Architecture:
--   Catalog: plan_versions, billing_policies
--   Billing: tenant_subscriptions (Partial Unique Index per tenant, is_test isolation)
--   Licensing: tenant_licenses linked to tenant_subscriptions
--
-- Relational Flow:
--   Plan (versi) ──► Subscription ──► Invoice ──► Payment
--                         │
--                         └──► License (diterbitkan dari subscription)
-- ==============================================================================

-- 1. TABEL PLAN_VERSIONS (DOMAIN: CATALOG)
CREATE TABLE IF NOT EXISTS plan_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    version VARCHAR(32) NOT NULL, -- e.g. 'v1.0.0', 'v1.1.0'
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- DRAFT, ACTIVE, ARCHIVED
    price_monthly NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    price_yearly NUMERIC(15,2) DEFAULT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
    
    -- Baseline Quotas & Entitlements
    max_projects INT NOT NULL DEFAULT 1,
    max_archived_projects INT NOT NULL DEFAULT 1,
    max_olts INT NOT NULL DEFAULT 1,
    max_odcs INT DEFAULT NULL,
    max_odps INT DEFAULT NULL,
    max_customers INT DEFAULT NULL,
    max_storage_gb INT NOT NULL DEFAULT 2,
    api_rate_limit_rpm INT NOT NULL DEFAULT 500,
    
    -- Feature Entitlements
    has_sso BOOLEAN NOT NULL DEFAULT FALSE,
    has_api_access BOOLEAN NOT NULL DEFAULT FALSE,
    has_ai_copilot BOOLEAN NOT NULL DEFAULT FALSE,
    has_custom_domain BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Operational Billing Policies
    grace_days INT NOT NULL DEFAULT 14,
    readonly_days INT NOT NULL DEFAULT 14,
    
    -- Version Lifecycle & Immutability
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    published_by VARCHAR(64) DEFAULT 'SYSTEM',
    changelog TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255),
    
    CONSTRAINT uk_plan_versions_plan_version UNIQUE (plan_id, version)
);

CREATE INDEX IF NOT EXISTS idx_plan_versions_plan_status ON plan_versions(plan_id, status);
CREATE INDEX IF NOT EXISTS idx_plan_versions_version ON plan_versions(version);

COMMENT ON TABLE plan_versions IS 'Versi paket langganan berstatus immutable setelah diterbitkan (Catalog Domain)';
COMMENT ON COLUMN plan_versions.version IS 'Nomor versi semantik paket e.g. v1.0.0';
COMMENT ON COLUMN plan_versions.status IS 'Status siklus hidup versi: DRAFT, ACTIVE, ARCHIVED';

-- 2. TABEL AUDIT ENVERS PLAN_VERSIONS
CREATE TABLE IF NOT EXISTS plan_versions_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    plan_id UUID,
    version VARCHAR(32),
    status VARCHAR(32),
    price_monthly NUMERIC(15,2),
    price_yearly NUMERIC(15,2),
    currency VARCHAR(3),
    max_projects INT,
    max_archived_projects INT,
    max_olts INT,
    max_odcs INT,
    max_odps INT,
    max_customers INT,
    max_storage_gb INT,
    api_rate_limit_rpm INT,
    has_sso BOOLEAN,
    has_api_access BOOLEAN,
    has_ai_copilot BOOLEAN,
    has_custom_domain BOOLEAN,
    grace_days INT,
    readonly_days INT,
    effective_from TIMESTAMP WITH TIME ZONE,
    effective_to TIMESTAMP WITH TIME ZONE,
    published_by VARCHAR(64),
    changelog TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(255),
    PRIMARY KEY (rev, id)
);

-- 3. TABEL BILLING_POLICIES (DOMAIN: CATALOG)
CREATE TABLE IF NOT EXISTS billing_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_key VARCHAR(64) NOT NULL UNIQUE,
    policy_value TEXT NOT NULL,
    value_type VARCHAR(32) NOT NULL DEFAULT 'STRING', -- STRING, INTEGER, DECIMAL, BOOLEAN, JSON
    category VARCHAR(64) NOT NULL DEFAULT 'BILLING', -- BILLING, DUNNING, NOTIFICATION, REGULATORY
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_billing_policies_key ON billing_policies(policy_key);
CREATE INDEX IF NOT EXISTS idx_billing_policies_cat ON billing_policies(category, is_active);

COMMENT ON TABLE billing_policies IS 'Konfigurasi kebijakan penagihan platform (Grace days, reminder schedule, tax, timezone)';

-- 4. TABEL AUDIT ENVERS BILLING_POLICIES
CREATE TABLE IF NOT EXISTS billing_policies_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    policy_key VARCHAR(64),
    policy_value TEXT,
    value_type VARCHAR(32),
    category VARCHAR(64),
    description TEXT,
    is_active BOOLEAN,
    version INT,
    effective_from TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(255),
    PRIMARY KEY (rev, id)
);

-- 5. TABEL TENANT_SUBSCRIPTIONS (DOMAIN: BILLING)
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_version_id UUID NOT NULL REFERENCES plan_versions(id),
    
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    -- ACTIVE, GRACE_PERIOD, RESTRICTED_READ_ONLY, SUSPENDED, CANCELLED, EXPIRED
    
    billing_cycle VARCHAR(16) NOT NULL DEFAULT 'MONTHLY',
    -- MONTHLY, YEARLY, LIFETIME
    
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    grace_period_end TIMESTAMP WITH TIME ZONE,
    next_invoice_at TIMESTAMP WITH TIME ZONE,
    
    cancel_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    -- Isolasi Tenant Uji E2E dari Metrik Finansial Platform (MRR, KPI)
    is_test BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Kontak Penagihan Terverifikasi Resmi
    billing_contact_name VARCHAR(128),
    billing_contact_email VARCHAR(255),
    billing_contact_phone VARCHAR(64),
    
    -- Custom Quota Overrides (Kontrak Enterprise Spesifik)
    override_max_projects INT DEFAULT NULL,
    override_max_archived_projects INT DEFAULT NULL,
    override_max_olts INT DEFAULT NULL,
    override_max_odcs INT DEFAULT NULL,
    override_max_odps INT DEFAULT NULL,
    override_max_customers INT DEFAULT NULL,
    override_max_storage_gb INT DEFAULT NULL,
    override_api_rate_limit_rpm INT DEFAULT NULL,
    
    -- Feature Entitlements Flags
    feature_sso_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    feature_api_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    feature_ai_copilot_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    feature_custom_domain_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255)
);

-- Constraint Parsial PostgreSQL: Maksimal 1 subscription berstatus aktif/grace/read-only per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_subscriptions_active_unique 
ON tenant_subscriptions (organization_id) 
WHERE status IN ('ACTIVE', 'GRACE_PERIOD', 'RESTRICTED_READ_ONLY');

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_org_status ON tenant_subscriptions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_period_end ON tenant_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_is_test ON tenant_subscriptions(is_test);

COMMENT ON TABLE tenant_subscriptions IS 'Langganan resmi tenant ke versi plan komersial (Billing Domain)';
COMMENT ON COLUMN tenant_subscriptions.is_test IS 'Flag isolasi tenant uji E2E agar tidak mencemari perhitungan MRR dan KPI';

-- 6. TABEL AUDIT ENVERS TENANT_SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS tenant_subscriptions_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    organization_id UUID,
    plan_version_id UUID,
    status VARCHAR(32),
    billing_cycle VARCHAR(16),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    grace_period_end TIMESTAMP WITH TIME ZONE,
    next_invoice_at TIMESTAMP WITH TIME ZONE,
    cancel_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    is_test BOOLEAN,
    billing_contact_name VARCHAR(128),
    billing_contact_email VARCHAR(255),
    billing_contact_phone VARCHAR(64),
    override_max_projects INT,
    override_max_archived_projects INT,
    override_max_olts INT,
    override_max_odcs INT,
    override_max_odps INT,
    override_max_customers INT,
    override_max_storage_gb INT,
    override_api_rate_limit_rpm INT,
    feature_sso_enabled BOOLEAN,
    feature_api_enabled BOOLEAN,
    feature_ai_copilot_enabled BOOLEAN,
    feature_custom_domain_enabled BOOLEAN,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(255),
    PRIMARY KEY (rev, id)
);

-- 7. KONEKSI RELASI KE TENANT_LICENSES & BILLING_INVOICES
ALTER TABLE tenant_licenses 
    ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES tenant_subscriptions(id) ON DELETE SET NULL;

ALTER TABLE tenant_licenses_aud 
    ADD COLUMN IF NOT EXISTS subscription_id UUID;

CREATE INDEX IF NOT EXISTS idx_tenant_licenses_subscription_id ON tenant_licenses(subscription_id);

ALTER TABLE billing_invoices 
    ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES tenant_subscriptions(id) ON DELETE SET NULL;

ALTER TABLE billing_invoices_aud 
    ADD COLUMN IF NOT EXISTS subscription_id UUID;

CREATE INDEX IF NOT EXISTS idx_billing_invoices_subscription_id ON billing_invoices(subscription_id);

-- 8. SEED DATA BILLING_POLICIES (KEBIJAKAN STANDAR ASIA/JAKARTA)
INSERT INTO billing_policies (policy_key, policy_value, value_type, category, description, is_active, version, effective_from)
VALUES
    ('billing.grace_days', '14', 'INTEGER', 'BILLING', 'Jumlah hari toleransi masa tenggang (Grace Period) setelah jatuh tempo sebelum masuk mode Read-Only', TRUE, 1, NOW()),
    ('billing.readonly_days', '14', 'INTEGER', 'BILLING', 'Jumlah hari masa Read-Only sebelum akses sistem ditangguhkan secara total (Suspended)', TRUE, 1, NOW()),
    ('billing.reminder_schedule_days', '30,14,7,1', 'STRING', 'NOTIFICATION', 'Jadwal hari dispatch notifikasi pengingat sebelum tanggal jatuh tempo (T-30, T-14, T-7, T-1)', TRUE, 1, NOW()),
    ('billing.timezone', 'Asia/Jakarta', 'STRING', 'REGULATORY', 'Zona waktu resmi seluruh kalkulasi siklus, proration, dan invoice penagihan platform', TRUE, 1, NOW()),
    ('billing.currency', 'IDR', 'STRING', 'BILLING', 'Mata uang baku platform untuk transaksi dan penagihan', TRUE, 1, NOW()),
    ('billing.tax_rate_percentage', '11.0', 'DECIMAL', 'REGULATORY', 'Tarif Pajak Pertambahan Nilai (PPN) resmi Indonesia', TRUE, 1, NOW()),
    ('billing.invoice_due_days', '14', 'INTEGER', 'BILLING', 'Jumlah hari pembayaran faktur tagihan sejak tanggal terbit', TRUE, 1, NOW())
ON CONFLICT (policy_key) DO UPDATE SET
    policy_value = EXCLUDED.policy_value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 9. BACKFILL PLAN_VERSIONS (BASELINE v1.0.0 DARI SUBSCRIPTION_PLANS)
INSERT INTO plan_versions (
    plan_id, version, status, price_monthly, price_yearly, currency,
    max_projects, max_archived_projects, max_olts, max_odcs, max_odps, max_customers,
    max_storage_gb, api_rate_limit_rpm, has_sso, has_api_access,
    grace_days, readonly_days, effective_from, published_by, changelog
)
SELECT 
    sp.id,
    'v1.0.0',
    'ACTIVE',
    sp.price,
    sp.price * 10, -- Standar paket tahunan (10x bulanan, 2 bulan free)
    'IDR',
    COALESCE(sp.max_projects, 1),
    COALESCE(sp.max_archived_projects, 1),
    COALESCE(sp.max_olts, 1),
    sp.max_odcs,
    sp.max_odps,
    sp.max_customers,
    COALESCE(sp.max_storage_gb, 2),
    COALESCE(sp.api_rate_limit_rpm, 500),
    COALESCE(sp.has_sso, FALSE),
    COALESCE(sp.has_api_access, FALSE),
    14,
    14,
    NOW(),
    'SYSTEM_MIGRATION_V66',
    'Baseline kanonikal versi 1.0.0 hasil migrasi dari subscription_plans master'
FROM subscription_plans sp
ON CONFLICT (plan_id, version) DO NOTHING;

-- 10. BACKFILL TENANT_SUBSCRIPTIONS DARI LISENSI AKTIF SAH ORGANISASI
INSERT INTO tenant_subscriptions (
    organization_id,
    plan_version_id,
    status,
    billing_cycle,
    current_period_start,
    current_period_end,
    grace_period_end,
    is_test,
    billing_contact_name,
    billing_contact_email,
    billing_contact_phone,
    override_max_projects,
    override_max_olts,
    override_max_odps,
    override_max_odcs,
    override_max_customers,
    override_max_storage_gb,
    feature_sso_enabled,
    feature_api_enabled,
    feature_ai_copilot_enabled,
    feature_custom_domain_enabled,
    notes,
    created_at,
    created_by,
    updated_at,
    updated_by
)
SELECT
    tl.organization_id,
    pv.id,
    tl.status,
    COALESCE(o.plan_cycle, 'MONTHLY'),
    tl.valid_from,
    tl.valid_until,
    tl.grace_period_until,
    CASE 
        WHEN o.slug IN ('ujicoba', 'test-suite') OR o.realm_key LIKE '%test%' THEN TRUE 
        ELSE FALSE 
    END,
    tl.billing_contact_name,
    tl.billing_contact_email,
    tl.billing_contact_phone,
    tl.override_max_projects,
    tl.override_max_olts,
    tl.override_max_odps,
    tl.override_max_odcs,
    tl.override_max_customers,
    tl.override_max_storage_gb,
    tl.feature_sso_enabled,
    tl.feature_api_enabled,
    tl.feature_ai_copilot_enabled,
    tl.feature_custom_domain_enabled,
    'Langganan aktif yang dimigrasikan otomatis dari lisensi sah ' || tl.license_key,
    tl.created_at,
    tl.created_by,
    tl.updated_at,
    tl.updated_by
FROM tenant_licenses tl
JOIN plan_versions pv ON pv.plan_id = tl.subscription_plan_id AND pv.version = 'v1.0.0'
JOIN organizations o ON o.id = tl.organization_id
WHERE tl.status IN ('ACTIVE', 'GRACE_PERIOD', 'RESTRICTED_READ_ONLY')
ON CONFLICT DO NOTHING;

-- 11. SINKRONISASI RELASI DUA ARAH SUBSCRIPTION KE TENANT_LICENSES & BILLING_INVOICES
UPDATE tenant_licenses tl
SET subscription_id = ts.id
FROM tenant_subscriptions ts
WHERE ts.organization_id = tl.organization_id
  AND tl.subscription_id IS NULL;

UPDATE billing_invoices bi
SET subscription_id = tl.subscription_id
FROM tenant_licenses tl
WHERE bi.license_id = tl.id
  AND bi.subscription_id IS NULL;

-- Hubungkan juga faktur invoice tanpa lisensi tetapi memiliki organisasi
UPDATE billing_invoices bi
SET subscription_id = ts.id
FROM tenant_subscriptions ts
WHERE bi.organization_id = ts.organization_id
  AND bi.subscription_id IS NULL;

-- 12. REGISTRASI PBAC PERMISSION BARU (CATALOG, BILLING, LICENSING)
INSERT INTO permissions (code, name, module, scope, description, created_at, updated_at) VALUES
    ('catalog.plans.read', 'View Catalog Plans & Versions', 'catalog', 'SYSTEM', 'Melihat daftar master plan dan versi komersial platform', NOW(), NOW()),
    ('catalog.plans.manage', 'Manage Catalog Plan Drafts', 'catalog', 'SYSTEM', 'Membuat dan mengedit draft versi paket langganan', NOW(), NOW()),
    ('catalog.plans.publish', 'Publish Catalog Plan Versions', 'catalog', 'SYSTEM', 'Mempublikasikan versi plan aktif ke seluruh platform', NOW(), NOW()),
    ('catalog.policies.read', 'View Billing Policies', 'catalog', 'SYSTEM', 'Melihat kebijakan penagihan, grace period, dan PPN', NOW(), NOW()),
    ('catalog.policies.manage', 'Manage Billing Policies', 'catalog', 'SYSTEM', 'Mengubah konfigurasi kebijakan penagihan platform', NOW(), NOW()),
    ('billing.read', 'View Billing Overview & KPIs', 'billing', 'SYSTEM', 'Melihat dasbor finansial, MRR, dan ikhtisar penagihan', NOW(), NOW()),
    ('billing.subscriptions.read', 'View Tenant Subscriptions', 'billing', 'SYSTEM', 'Melihat daftar langganan aktif tenant dan histori siklus', NOW(), NOW()),
    ('billing.subscriptions.manage', 'Manage Tenant Subscriptions', 'billing', 'SYSTEM', 'Mengubah paket langganan, proration, dan kontak penagihan', NOW(), NOW()),
    ('billing.invoices.read', 'View Invoices & Payments', 'billing', 'SYSTEM', 'Melihat daftar faktur tagihan dan riwayat pelunasan', NOW(), NOW()),
    ('billing.invoices.manage', 'Manage Invoices & Payments', 'billing', 'SYSTEM', 'Menerbitkan, membatalkan, dan rekonsiliasi faktur pembayaran', NOW(), NOW()),
    ('licensing.read', 'View Licenses & Revocations', 'licensing', 'SYSTEM', 'Melihat daftar lisensi kriptografis dan status kill-switch', NOW(), NOW()),
    ('licensing.issue', 'Issue Licenses From Subscription', 'licensing', 'SYSTEM', 'Menerbitkan lisensi digital bertanda tangan Ed25519', NOW(), NOW()),
    ('licensing.extend', 'Extend License Duration', 'licensing', 'SYSTEM', 'Memperpanjang masa aktif lisensi tenant', NOW(), NOW()),
    ('licensing.revoke', 'Revoke Tenant License', 'licensing', 'SYSTEM', 'Mencabut akses lisensi tenant secara selektif', NOW(), NOW()),
    ('licensing.reinstate', 'Reinstate Revoked License', 'licensing', 'SYSTEM', 'Mengaktifkan kembali lisensi yang sempat ditangguhkan atau re-issue', NOW(), NOW()),
    ('licensing.killswitch', 'Execute Emergency Kill-Switch', 'licensing', 'SYSTEM', 'Eksekusi darurat pemutusan akses lisensi dengan proteksi ganda', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 13. ASSIGN PERMISSIONS BARU KE ROLE SUPER_ADMIN
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE p.code IN (
    'catalog.plans.read', 'catalog.plans.manage', 'catalog.plans.publish',
    'catalog.policies.read', 'catalog.policies.manage',
    'billing.read', 'billing.subscriptions.read', 'billing.subscriptions.manage',
    'billing.invoices.read', 'billing.invoices.manage',
    'licensing.read', 'licensing.issue', 'licensing.extend', 'licensing.revoke',
    'licensing.reinstate', 'licensing.killswitch'
)
AND r.name = 'super_admin'
ON CONFLICT DO NOTHING;
