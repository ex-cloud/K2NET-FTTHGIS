-- Migration V39: Create tenant_webhook_configs and tenant_webhook_logs tables
-- Supporting secure hashed API key storage, encrypted HMAC secrets, rate limits, and SSRF-audited delivery logs.

CREATE TABLE IF NOT EXISTS tenant_webhook_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    api_key_hash VARCHAR(64) NOT NULL UNIQUE,
    api_key_prefix VARCHAR(32) NOT NULL,
    api_key_last4 VARCHAR(8) NOT NULL,
    webhook_url VARCHAR(512),
    webhook_secret_encrypted VARCHAR(512),
    rate_limit_per_minute INTEGER NOT NULL DEFAULT 5000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    subscribed_events JSONB NOT NULL DEFAULT '{"fiberCut": true, "oltDown": true, "odpFull": true, "quotaAlert": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS tenant_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_name VARCHAR(100) NOT NULL,
    target_url VARCHAR(512) NOT NULL,
    http_status INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    request_payload JSONB,
    response_body TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_webhook_configs_org ON tenant_webhook_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_tenant_webhook_configs_key_hash ON tenant_webhook_configs(api_key_hash);
CREATE INDEX IF NOT EXISTS idx_tenant_webhook_logs_org_created ON tenant_webhook_logs(organization_id, created_at DESC);

-- Backfill initial webhook config record for any existing organizations without one
INSERT INTO tenant_webhook_configs (
    organization_id,
    api_key_hash,
    api_key_prefix,
    api_key_last4,
    webhook_url,
    webhook_secret_encrypted,
    rate_limit_per_minute,
    is_active,
    subscribed_events,
    created_at,
    updated_at
)
SELECT 
    o.id,
    encode(digest('k2_live_' || o.slug || '_' || md5(o.id::text || o.slug), 'sha256'), 'hex'),
    'k2_live_' || SUBSTRING(o.slug FROM 1 FOR 8) || '_',
    SUBSTRING(md5(o.id::text) FROM 1 FOR 4),
    NULL,
    NULL,
    5000,
    TRUE,
    '{"fiberCut": true, "oltDown": true, "odpFull": true, "quotaAlert": false}'::jsonb,
    NOW(),
    NOW()
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_webhook_configs twc WHERE twc.organization_id = o.id
);
