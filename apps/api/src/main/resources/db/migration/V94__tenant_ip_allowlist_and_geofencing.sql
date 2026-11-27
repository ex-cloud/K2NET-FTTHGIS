-- V94: Tenant IP Allowlist Modes, Country Geofencing & Break-Glass IP Bypass Governance (ADR-0032)

ALTER TABLE tenant_security_policies
    ADD COLUMN IF NOT EXISTS ip_policy_mode VARCHAR(24) NOT NULL DEFAULT 'ENFORCE',
    ADD COLUMN IF NOT EXISTS allowed_countries VARCHAR(255),
    ADD COLUMN IF NOT EXISTS allow_break_glass_ip_bypass BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE tenant_security_policies_aud
    ADD COLUMN IF NOT EXISTS ip_policy_mode VARCHAR(24),
    ADD COLUMN IF NOT EXISTS allowed_countries VARCHAR(255),
    ADD COLUMN IF NOT EXISTS allow_break_glass_ip_bypass BOOLEAN;

CREATE INDEX IF NOT EXISTS idx_tenant_sec_policy_ip_mode
    ON tenant_security_policies (ip_policy_mode);
