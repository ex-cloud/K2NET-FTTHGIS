-- ==============================================================================
-- Flyway Migration V91: Enterprise SCIM 2.0 Provisioning & Group Role Mapping
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Goals (ADR-0029):
--   1. Create organization_scim_tokens (+ _aud) for SHA-256 SCIM Bearer Tokens.
--   2. Create organization_scim_groups (+ _aud) & organization_scim_group_members (+ _aud).
--   3. Add scim_external_id & scim_managed columns to organization_members (+ _aud).
-- ==============================================================================

-- 1. SCIM 2.0 Scoped Bearer Tokens per Organization
CREATE TABLE IF NOT EXISTS organization_scim_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    token_prefix VARCHAR(24) NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    last_used_ip VARCHAR(64),
    revoked_at TIMESTAMPTZ,
    revoked_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_org_scim_tokens_org
    ON organization_scim_tokens (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_org_scim_tokens_hash_active
    ON organization_scim_tokens (token_hash, is_active);

CREATE TABLE IF NOT EXISTS organization_scim_tokens_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    organization_id UUID,
    name VARCHAR(120),
    token_prefix VARCHAR(24),
    token_hash VARCHAR(64),
    is_active BOOLEAN,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    last_used_ip VARCHAR(64),
    revoked_at TIMESTAMPTZ,
    revoked_by VARCHAR(255),
    created_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(255),
    PRIMARY KEY (id, rev)
);

-- 2. SCIM 2.0 Groups & Role Mapping (Scope TENANT only)
CREATE TABLE IF NOT EXISTS organization_scim_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    external_id VARCHAR(255),
    display_name VARCHAR(255) NOT NULL,
    mapped_role_id BIGINT REFERENCES roles(id) ON DELETE SET NULL,
    mapped_role_name VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255),
    CONSTRAINT uq_org_scim_groups_org_name UNIQUE (organization_id, display_name)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_scim_groups_org_external
    ON organization_scim_groups (organization_id, external_id)
    WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_org_scim_groups_org
    ON organization_scim_groups (organization_id);

CREATE TABLE IF NOT EXISTS organization_scim_groups_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    organization_id UUID,
    external_id VARCHAR(255),
    display_name VARCHAR(255),
    mapped_role_id BIGINT,
    mapped_role_name VARCHAR(64),
    created_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(255),
    PRIMARY KEY (id, rev)
);

-- 3. SCIM Group Memberships
CREATE TABLE IF NOT EXISTS organization_scim_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES organization_scim_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255),
    CONSTRAINT uq_org_scim_group_members_group_user UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_scim_group_members_user
    ON organization_scim_group_members (user_id);

CREATE TABLE IF NOT EXISTS organization_scim_group_members_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    group_id UUID,
    user_id UUID,
    created_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(255),
    PRIMARY KEY (id, rev)
);

-- 4. Track SCIM externalId & management origin on organization_members (+ Envers _aud parity)
ALTER TABLE organization_members
    ADD COLUMN IF NOT EXISTS scim_external_id VARCHAR(255);

ALTER TABLE organization_members
    ADD COLUMN IF NOT EXISTS scim_managed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE organization_members_aud
    ADD COLUMN IF NOT EXISTS scim_external_id VARCHAR(255);

ALTER TABLE organization_members_aud
    ADD COLUMN IF NOT EXISTS scim_managed BOOLEAN;

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_members_scim_external_id
    ON organization_members (organization_id, scim_external_id)
    WHERE scim_external_id IS NOT NULL;
