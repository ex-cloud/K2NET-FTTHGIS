-- ==============================================================================
-- Flyway Migration V92: Dual-Certificate SAML 2.0 Overlap & Zero-Downtime Key Rotation
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Goals (ADR-0030 / Fase 7.16):
--   1. Add Secondary X.509 signing certificate, SHA-256 fingerprints, expiry/subject
--      metadata, overlap start timestamp, and last rotation timestamp to
--      organization_sso_configs.
--   2. Maintain full Hibernate Envers parity on organization_sso_configs_aud.
-- ==============================================================================

ALTER TABLE organization_sso_configs
    ADD COLUMN IF NOT EXISTS secondary_signing_certificate TEXT,
    ADD COLUMN IF NOT EXISTS secondary_saml_cert_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS secondary_saml_cert_subject VARCHAR(255),
    ADD COLUMN IF NOT EXISTS saml_cert_fingerprint VARCHAR(95),
    ADD COLUMN IF NOT EXISTS secondary_saml_cert_fingerprint VARCHAR(95),
    ADD COLUMN IF NOT EXISTS saml_cert_overlap_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS saml_cert_rotated_at TIMESTAMPTZ;

ALTER TABLE organization_sso_configs_aud
    ADD COLUMN IF NOT EXISTS secondary_signing_certificate TEXT,
    ADD COLUMN IF NOT EXISTS secondary_saml_cert_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS secondary_saml_cert_subject VARCHAR(255),
    ADD COLUMN IF NOT EXISTS saml_cert_fingerprint VARCHAR(95),
    ADD COLUMN IF NOT EXISTS secondary_saml_cert_fingerprint VARCHAR(95),
    ADD COLUMN IF NOT EXISTS saml_cert_overlap_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS saml_cert_rotated_at TIMESTAMPTZ;
