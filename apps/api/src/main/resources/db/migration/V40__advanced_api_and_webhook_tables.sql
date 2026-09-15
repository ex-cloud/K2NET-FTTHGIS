-- Migration V40: Create tenant_api_tokens, tenant_webhook_endpoints, and enhance logs with Dead Letter Queue & Retry metadata

-- 1. Scoped Personal Access Tokens
CREATE TABLE IF NOT EXISTS tenant_api_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    token_prefix VARCHAR(32) NOT NULL,
    token_last4 VARCHAR(8) NOT NULL,
    scopes JSONB NOT NULL DEFAULT '["coverage:read"]'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_tenant_api_tokens_org ON tenant_api_tokens(organization_id, is_revoked, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_api_tokens_hash ON tenant_api_tokens(token_hash);

-- 2. Multi-Endpoint Webhooks Router
CREATE TABLE IF NOT EXISTS tenant_webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    target_url VARCHAR(512) NOT NULL,
    webhook_secret_encrypted VARCHAR(512),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    subscribed_events JSONB NOT NULL DEFAULT '{"fiberCut": true, "oltDown": true, "odpFull": true, "quotaAlert": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_tenant_webhook_endpoints_org ON tenant_webhook_endpoints(organization_id, is_active);

-- 3. Enhance tenant_webhook_logs with DLQ & Retry tracking
ALTER TABLE tenant_webhook_logs 
    ADD COLUMN IF NOT EXISTS endpoint_id UUID REFERENCES tenant_webhook_endpoints(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
    ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_retries INTEGER NOT NULL DEFAULT 4,
    ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_tenant_webhook_logs_dlq ON tenant_webhook_logs(delivery_status, next_retry_at) WHERE delivery_status = 'RETRYING';
CREATE INDEX IF NOT EXISTS idx_tenant_webhook_logs_status ON tenant_webhook_logs(organization_id, delivery_status, created_at DESC);

-- 4. Backfill existing primary webhook configs to tenant_webhook_endpoints
INSERT INTO tenant_webhook_endpoints (
    organization_id,
    name,
    target_url,
    webhook_secret_encrypted,
    is_active,
    subscribed_events,
    created_at,
    updated_at
)
SELECT 
    twc.organization_id,
    'Primary NOC Webhook',
    twc.webhook_url,
    twc.webhook_secret_encrypted,
    twc.is_active,
    twc.subscribed_events,
    twc.created_at,
    twc.updated_at
FROM tenant_webhook_configs twc
WHERE twc.webhook_url IS NOT NULL AND twc.webhook_url != ''
AND NOT EXISTS (
    SELECT 1 FROM tenant_webhook_endpoints twe WHERE twe.organization_id = twc.organization_id
);
