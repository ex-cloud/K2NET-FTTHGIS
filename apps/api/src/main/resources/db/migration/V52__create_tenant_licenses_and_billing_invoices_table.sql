-- ============================================================
-- Flyway Migration V52: Create Tenant Licenses & Billing Invoices
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
-- ============================================================

-- 1. TABEL LISENSI RESMI ORGANISASI (DIMENSI TEKNIS RUNTIME)
CREATE TABLE IF NOT EXISTS tenant_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    
    -- Format Kriptografis: K2NET-{TIER}-{RANDOM_HEX}-{SIGNATURE_CHECKSUM}
    license_key VARCHAR(64) NOT NULL UNIQUE,
    license_signature TEXT NOT NULL,          -- Ed25519 Digital Signature / HMAC Digest
    
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', 
    -- Nilai Status: ACTIVE, GRACE_PERIOD, RESTRICTED_READ_ONLY, SUSPENDED, REVOKED
    
    activation_type VARCHAR(16) NOT NULL DEFAULT 'ONLINE', 
    -- Nilai Tipe: ONLINE, OFFLINE_KEY, ENTERPRISE_PO
    
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    grace_period_until TIMESTAMP WITH TIME ZONE,
    
    -- Custom Quota Overrides (Jika kontrak menyepakati batas khusus di luar default plan V44)
    override_max_projects INT DEFAULT NULL,
    override_max_odps INT DEFAULT NULL,
    override_max_odcs INT DEFAULT NULL,
    override_max_customers INT DEFAULT NULL,
    override_max_storage_gb INT DEFAULT NULL,
    
    -- Feature Entitlements Flags
    feature_sso_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    feature_api_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    feature_ai_copilot_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    feature_custom_domain_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Hardware Binding (Khusus instalasi On-Premise Air-gapped)
    machine_fingerprint VARCHAR(128) DEFAULT NULL,
    
    issued_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_BILLING',
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255)
);

-- 2. TABEL AUDIT ENVERS LISENSI (HIBERNATE ENVERS AUDITING)
CREATE TABLE IF NOT EXISTS tenant_licenses_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    organization_id UUID,
    subscription_plan_id UUID,
    license_key VARCHAR(64),
    license_signature TEXT,
    status VARCHAR(32),
    activation_type VARCHAR(16),
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    grace_period_until TIMESTAMP WITH TIME ZONE,
    override_max_projects INT,
    override_max_odps INT,
    override_max_odcs INT,
    override_max_customers INT,
    override_max_storage_gb INT,
    feature_sso_enabled BOOLEAN,
    feature_api_enabled BOOLEAN,
    feature_ai_copilot_enabled BOOLEAN,
    feature_custom_domain_enabled BOOLEAN,
    machine_fingerprint VARCHAR(128),
    issued_by VARCHAR(64),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(255),
    PRIMARY KEY (rev, id)
);

-- 3. TABEL FAKTUR PENAGIHAN & HISTORI PEMBAYARAN (DIMENSI FINANSIAL)
CREATE TABLE IF NOT EXISTS billing_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    license_id UUID REFERENCES tenant_licenses(id) ON DELETE SET NULL,
    
    invoice_number VARCHAR(64) NOT NULL UNIQUE, -- Contoh: INV/2026/10/K2-00892
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
    
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', 
    -- Nilai Status: PENDING, PAID, OVERDUE, EXPIRED, CANCELLED
    
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    
    payment_method VARCHAR(32) DEFAULT NULL,    -- XENDIT_VA, XENDIT_QRIS, MANUAL_TRANSFER, ENTERPRISE_PO
    payment_channel VARCHAR(64) DEFAULT NULL,   -- BCA, MANDIRI, BRI, BNI
    external_invoice_url TEXT DEFAULT NULL,     -- URL Checkout Xendit
    external_reference_id VARCHAR(128) DEFAULT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255)
);

-- 4. TABEL AUDIT ENVERS FAKTUR PENAGIHAN (HIBERNATE ENVERS AUDITING)
CREATE TABLE IF NOT EXISTS billing_invoices_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    organization_id UUID,
    license_id UUID,
    invoice_number VARCHAR(64),
    description VARCHAR(255),
    amount NUMERIC(15,2),
    currency VARCHAR(3),
    status VARCHAR(32),
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(32),
    payment_channel VARCHAR(64),
    external_invoice_url TEXT,
    external_reference_id VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(255),
    PRIMARY KEY (rev, id)
);

-- 5. INDEKS PERFORMA & TENANT ISOLATION
CREATE INDEX IF NOT EXISTS idx_tenant_licenses_org_status ON tenant_licenses(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_licenses_valid_until ON tenant_licenses(valid_until);
CREATE INDEX IF NOT EXISTS idx_tenant_licenses_key ON tenant_licenses(license_key);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_org ON billing_invoices(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_due ON billing_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status ON billing_invoices(status);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_ref ON billing_invoices(external_reference_id);

-- 6. REGISTRASI GRANULAR PBAC PERMISSIONS (Scope: TENANT)
INSERT INTO permissions (code, name, module, scope, description, created_at, updated_at) VALUES
    ('billing.view', 'View Tenant Billing & License', 'billing', 'TENANT', 'Melihat status lisensi aktif, kuota utilisasi, dan riwayat faktur tagihan', NOW(), NOW()),
    ('billing.manage', 'Manage Tenant Billing & License', 'billing', 'TENANT', 'Mengaktivasi lisensi, memperpanjang paket, dan memproses pembayaran tagihan', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 7. MAPPING PERMISSIONS KE DEFAULT ROLES (super_admin, admin, finance)
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE p.code IN ('billing.view', 'billing.manage')
  AND r.name IN ('super_admin', 'admin', 'finance')
ON CONFLICT DO NOTHING;
