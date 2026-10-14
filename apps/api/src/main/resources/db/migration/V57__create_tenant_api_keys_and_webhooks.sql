-- ==============================================================================
-- K2NET FTTH GIS — V57: Developer REST API & Webhooks Engine (PKG_OPEN_API)
-- Support for Multi-Tenant Scoped API Keys, Webhook Subscriptions, and Delivery Logs
-- Includes Hibernate Envers Audit Tables for Full Schema Consistency
-- ==============================================================================

-- 1. Create tenant_api_keys table
CREATE TABLE IF NOT EXISTS tenant_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(16) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    scopes VARCHAR(500) NOT NULL DEFAULT 'read:network,read:telemetry',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_tenant_api_keys_hash ON tenant_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_tenant_api_keys_org ON tenant_api_keys(organization_id, created_at DESC);

COMMENT ON TABLE tenant_api_keys IS 'Developer API keys for programmatic external system integration';
COMMENT ON COLUMN tenant_api_keys.key_prefix IS 'Masked display prefix e.g. k2_live_1234';
COMMENT ON COLUMN tenant_api_keys.key_hash IS 'SHA-256 hash of the secret raw API key';

-- 2. Create tenant_api_keys_aud table (Hibernate Envers Audit Table)
CREATE TABLE IF NOT EXISTS tenant_api_keys_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    organization_id UUID,
    name VARCHAR(100),
    key_prefix VARCHAR(16),
    key_hash VARCHAR(64),
    scopes VARCHAR(500),
    is_active BOOLEAN,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(255),
    PRIMARY KEY (rev, id)
);

-- 3. Create tenant_webhooks table
CREATE TABLE IF NOT EXISTS tenant_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(1024) NOT NULL,
    signing_secret VARCHAR(64) NOT NULL,
    events VARCHAR(500) NOT NULL DEFAULT 'network.olt.status,network.outage,customer.created',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    headers TEXT,
    failure_count INT NOT NULL DEFAULT 0,
    last_delivery_at TIMESTAMP WITH TIME ZONE,
    last_delivery_status VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_tenant_webhooks_org ON tenant_webhooks(organization_id, is_active);

COMMENT ON TABLE tenant_webhooks IS 'Tenant webhook subscriptions for real-time outbound event notifications';
COMMENT ON COLUMN tenant_webhooks.signing_secret IS 'HMAC-SHA256 secret key for signing payload with X-K2NET-Signature-256 header';

-- 4. Create tenant_webhooks_aud table (Hibernate Envers Audit Table)
CREATE TABLE IF NOT EXISTS tenant_webhooks_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    organization_id UUID,
    name VARCHAR(100),
    url VARCHAR(1024),
    signing_secret VARCHAR(64),
    events VARCHAR(500),
    is_active BOOLEAN,
    headers TEXT,
    failure_count INT,
    last_delivery_at TIMESTAMP WITH TIME ZONE,
    last_delivery_status VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(255),
    PRIMARY KEY (rev, id)
);

-- 5. Create tenant_webhook_deliveries table (Append-only delivery receipts)
CREATE TABLE IF NOT EXISTS tenant_webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    webhook_id UUID NOT NULL REFERENCES tenant_webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    payload TEXT NOT NULL,
    response_status_code INT,
    response_body TEXT,
    execution_duration_ms BIGINT,
    status VARCHAR(32) NOT NULL,
    error_message TEXT,
    attempt_number INT NOT NULL DEFAULT 1,
    delivered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_tenant_webhook_deliv_webhook ON tenant_webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_webhook_deliv_org ON tenant_webhook_deliveries(organization_id, created_at DESC);

COMMENT ON TABLE tenant_webhook_deliveries IS 'Audit logs and delivery receipts for outbound webhook HTTP dispatches';

-- 6. Register granular permission and assign to canonical admin roles
INSERT INTO permissions (id, code, name, description, module, scope, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'feature.integration.open_api',
    'Developer REST API & Webhooks Access',
    'Permission to generate API keys, configure webhooks, and trigger integration events',
    'integration',
    'TENANT',
    NOW(),
    NOW()
) ON CONFLICT (code) DO NOTHING;

-- Grant to 'admin' system tenant role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' AND r.is_system_role = TRUE
  AND p.code = 'feature.integration.open_api'
ON CONFLICT DO NOTHING;

-- Grant to 'super_admin' system role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin' AND r.is_system_role = TRUE
  AND p.code = 'feature.integration.open_api'
ON CONFLICT DO NOTHING;
