-- ==============================================================================
-- Flyway Migration V93: Real-Time Security Audit Webhook / SIEM Event Streaming
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Goals (ADR-0031 / Fase 7.17):
--   1. Create tenant_siem_endpoints (+ Envers _aud) for Enterprise SIEM streaming.
--   2. Create tenant_siem_deliveries for delivery logs, backoff retries, and DLQ.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS tenant_siem_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    target_url VARCHAR(1024) NOT NULL,
    target_format VARCHAR(32) NOT NULL DEFAULT 'GENERIC_JSON',
    signing_secret_encrypted TEXT NOT NULL,
    signing_secret_prefix VARCHAR(32) NOT NULL,
    custom_auth_header_name VARCHAR(64),
    custom_auth_header_encrypted TEXT,
    event_categories TEXT NOT NULL DEFAULT 'AUTH,SSO,SCIM,SECURITY,ADMIN',
    min_severity VARCHAR(16) NOT NULL DEFAULT 'WARNING',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    auto_disabled_at TIMESTAMPTZ,
    auto_disabled_reason VARCHAR(512),
    last_delivery_at TIMESTAMPTZ,
    last_delivery_status VARCHAR(24),
    last_http_status INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_siem_endpoints_org_active
    ON tenant_siem_endpoints (organization_id, is_active);

CREATE TABLE IF NOT EXISTS tenant_siem_endpoints_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    organization_id UUID,
    name VARCHAR(120),
    target_url VARCHAR(1024),
    target_format VARCHAR(32),
    signing_secret_encrypted TEXT,
    signing_secret_prefix VARCHAR(32),
    custom_auth_header_name VARCHAR(64),
    custom_auth_header_encrypted TEXT,
    event_categories TEXT,
    min_severity VARCHAR(16),
    is_active BOOLEAN,
    consecutive_failures INTEGER,
    auto_disabled_at TIMESTAMPTZ,
    auto_disabled_reason VARCHAR(512),
    last_delivery_at TIMESTAMPTZ,
    last_delivery_status VARCHAR(24),
    last_http_status INTEGER,
    created_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(255),
    PRIMARY KEY (id, rev)
);

CREATE TABLE IF NOT EXISTS tenant_siem_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID NOT NULL REFERENCES tenant_siem_endpoints(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_id VARCHAR(128) NOT NULL,
    event_action VARCHAR(128) NOT NULL,
    event_category VARCHAR(32) NOT NULL,
    event_severity VARCHAR(16) NOT NULL,
    payload_json TEXT NOT NULL,
    delivery_status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    next_retry_at TIMESTAMPTZ,
    http_status_code INTEGER,
    response_snippet TEXT,
    error_message VARCHAR(512),
    latency_ms INTEGER,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_siem_deliveries_retry
    ON tenant_siem_deliveries (delivery_status, next_retry_at)
    WHERE delivery_status IN ('PENDING', 'RETRYING');

CREATE INDEX IF NOT EXISTS idx_siem_deliveries_endpoint_created
    ON tenant_siem_deliveries (endpoint_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_siem_deliveries_org_status
    ON tenant_siem_deliveries (organization_id, delivery_status);
