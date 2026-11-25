-- ==============================================================================
-- Flyway Migration V90: Proactive SSO IdP Health Probe & Certificate Expiry
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Goals (ADR-0026 / Fase 7.3):
--   1. Add health probe telemetry, TLS/SAML certificate expiry, client secret
--      expiry, hysteresis failure counter, and anti-spam alert deduplication
--      columns to organization_sso_configs.
--   2. Keep Hibernate Envers parity on organization_sso_configs_aud.
--   3. Index (status, health_status) for fast background probe and dashboard queries.
-- ==============================================================================

ALTER TABLE organization_sso_configs
    ADD COLUMN IF NOT EXISTS health_status VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN'
        CHECK (health_status IN ('UNKNOWN', 'HEALTHY', 'DEGRADED', 'UNHEALTHY')),
    ADD COLUMN IF NOT EXISTS last_health_check_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_health_latency_ms INTEGER,
    ADD COLUMN IF NOT EXISTS consecutive_probe_failures INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_health_error TEXT,
    ADD COLUMN IF NOT EXISTS tls_cert_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS tls_cert_subject VARCHAR(255),
    ADD COLUMN IF NOT EXISTS saml_cert_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS saml_cert_subject VARCHAR(255),
    ADD COLUMN IF NOT EXISTS client_secret_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_alert_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_alert_stage VARCHAR(32);

CREATE INDEX IF NOT EXISTS idx_org_sso_configs_health_status
    ON organization_sso_configs (status, health_status);

ALTER TABLE organization_sso_configs_aud
    ADD COLUMN IF NOT EXISTS health_status VARCHAR(32),
    ADD COLUMN IF NOT EXISTS last_health_check_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_health_latency_ms INTEGER,
    ADD COLUMN IF NOT EXISTS consecutive_probe_failures INTEGER,
    ADD COLUMN IF NOT EXISTS last_health_error TEXT,
    ADD COLUMN IF NOT EXISTS tls_cert_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS tls_cert_subject VARCHAR(255),
    ADD COLUMN IF NOT EXISTS saml_cert_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS saml_cert_subject VARCHAR(255),
    ADD COLUMN IF NOT EXISTS client_secret_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_alert_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_alert_stage VARCHAR(32);
