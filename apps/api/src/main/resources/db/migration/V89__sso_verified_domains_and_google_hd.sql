-- ==============================================================================
-- Flyway Migration V89: Verified SSO Domains (DNS TXT) & Google Workspace HD
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Goals (ADR-0023):
--   1. Create organization_verified_domains table + Partial Unique Index on VERIFIED.
--   2. Create organization_verified_domains_aud Hibernate Envers audit table.
--   3. Backfill active organization_sso_configs.domain_mappings as VERIFIED (Opsi 1).
--   4. Add google_hosted_domain column to tenant_security_policies (+ _aud).
-- ==============================================================================

-- 1. Create organization_verified_domains Table
CREATE TABLE IF NOT EXISTS organization_verified_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    verification_token VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'VERIFIED', 'FAILED')),
    verified_at TIMESTAMPTZ,
    last_checked_at TIMESTAMPTZ,
    last_error_message TEXT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255),
    CONSTRAINT uq_org_verified_domains_org_domain UNIQUE (organization_id, domain)
);

-- Atomic anti-squatting & anti-TOCTOU partial unique index: only ONE tenant can hold VERIFIED status per domain
CREATE UNIQUE INDEX IF NOT EXISTS uq_org_verified_domains_active_verified
    ON organization_verified_domains (domain)
    WHERE status = 'VERIFIED';

CREATE INDEX IF NOT EXISTS idx_org_verified_domains_org
    ON organization_verified_domains (organization_id);

CREATE INDEX IF NOT EXISTS idx_org_verified_domains_lookup
    ON organization_verified_domains (domain, status);

-- 2. Create Hibernate Envers Audit Table (organization_verified_domains_aud)
CREATE TABLE IF NOT EXISTS organization_verified_domains_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    organization_id UUID,
    domain VARCHAR(255),
    verification_token VARCHAR(128),
    status VARCHAR(32),
    verified_at TIMESTAMPTZ,
    last_checked_at TIMESTAMPTZ,
    last_error_message TEXT,
    version BIGINT,
    created_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(255),
    PRIMARY KEY (id, rev)
);

-- 3. Backfill existing ACTIVE SSO domain_mappings as VERIFIED (Opsi 1 — Zero-Regression)
INSERT INTO organization_verified_domains (
    organization_id,
    domain,
    verification_token,
    status,
    verified_at,
    last_checked_at,
    created_at,
    created_by,
    updated_at,
    updated_by
)
SELECT
    osc.organization_id,
    LOWER(TRIM(d.domain_val)) AS domain,
    'k2net-domain-verification=' || md5(osc.organization_id::text || ':' || LOWER(TRIM(d.domain_val))),
    'VERIFIED',
    NOW(),
    NOW(),
    NOW(),
    'flyway-v89-backfill',
    NOW(),
    'flyway-v89-backfill'
FROM organization_sso_configs osc
JOIN organizations o ON o.id = osc.organization_id
CROSS JOIN LATERAL jsonb_array_elements_text(osc.domain_mappings) AS d(domain_val)
WHERE o.deleted_at IS NULL
  AND osc.status = 'ACTIVE'
  AND jsonb_typeof(osc.domain_mappings) = 'array'
  AND TRIM(d.domain_val) <> ''
ON CONFLICT (organization_id, domain) DO NOTHING;

-- 4. Add Google Workspace Hosted Domain (hd) Restriction to tenant_security_policies (+ _aud)
ALTER TABLE tenant_security_policies
    ADD COLUMN IF NOT EXISTS google_hosted_domain VARCHAR(255);

ALTER TABLE tenant_security_policies_aud
    ADD COLUMN IF NOT EXISTS google_hosted_domain VARCHAR(255);
