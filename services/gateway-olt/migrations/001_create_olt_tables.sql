-- Migration: Create OLT schema
CREATE TABLE IF NOT EXISTS olts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    host VARCHAR(100) NOT NULL,
    port INTEGER DEFAULT 161,
    vendor VARCHAR(50) NOT NULL, -- zte, huawei, fiberhome
    community VARCHAR(255) NOT NULL, -- SNMP community read
    write_community VARCHAR(255),    -- SNMP community write
    username VARCHAR(100),           -- SSH username (optional)
    password VARCHAR(255),           -- SSH password (optional, encrypted)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_olts_tenant ON olts(tenant_slug);
