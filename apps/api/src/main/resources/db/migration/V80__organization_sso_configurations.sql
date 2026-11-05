-- ==============================================================================
-- Flyway Migration V80: Organization SSO Configurations (Enterprise Identity)
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Goals:
--   1. Create organization_sso_configs table with AES-256 encrypted secrets and domain mappings.
--   2. Create organization_sso_configs_aud Envers audit table.
--   3. Register granular PBAC permissions for Tenant and System SSO Management.
-- ==============================================================================

-- 1. Create organization_sso_configs Table
CREATE TABLE IF NOT EXISTS organization_sso_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider_type VARCHAR(32) NOT NULL DEFAULT 'OIDC_CUSTOM',
    display_name VARCHAR(128),
    issuer_url VARCHAR(512),
    client_id VARCHAR(256) NOT NULL,
    client_secret_encrypted TEXT,
    metadata_url VARCHAR(512),
    entity_id VARCHAR(256),
    single_sign_on_url VARCHAR(512),
    signing_certificate TEXT,
    enforce_sso BOOLEAN NOT NULL DEFAULT FALSE,
    allow_break_glass_bypass BOOLEAN NOT NULL DEFAULT TRUE,
    domain_mappings JSONB NOT NULL DEFAULT '[]'::jsonb,
    attribute_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'INACTIVE',
    last_test_at TIMESTAMPTZ,
    last_test_status VARCHAR(32),
    last_test_error_message TEXT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255),
    CONSTRAINT uq_org_sso_config_provider UNIQUE (organization_id, provider_type)
);

CREATE INDEX IF NOT EXISTS idx_org_sso_configs_org ON organization_sso_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_sso_configs_status ON organization_sso_configs(status);

-- 2. Create Envers Audit Table (organization_sso_configs_aud)
CREATE TABLE IF NOT EXISTS organization_sso_configs_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    organization_id UUID,
    provider_type VARCHAR(32),
    display_name VARCHAR(128),
    issuer_url VARCHAR(512),
    client_id VARCHAR(256),
    client_secret_encrypted TEXT,
    metadata_url VARCHAR(512),
    entity_id VARCHAR(256),
    single_sign_on_url VARCHAR(512),
    signing_certificate TEXT,
    enforce_sso BOOLEAN,
    allow_break_glass_bypass BOOLEAN,
    domain_mappings JSONB,
    attribute_mapping JSONB,
    status VARCHAR(32),
    last_test_at TIMESTAMPTZ,
    last_test_status VARCHAR(32),
    last_test_error_message TEXT,
    version BIGINT,
    created_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(255),
    PRIMARY KEY (id, rev)
);

-- 3. Register Granular PBAC Permissions
-- 3a. TENANT Scope Permissions
INSERT INTO permissions (code, name, module, scope, description, created_at, updated_at) VALUES
    ('security.sso.view',   'View Tenant SSO Configuration',   'security', 'TENANT', 'Grants view access to tenant organization SSO and identity provider settings', NOW(), NOW()),
    ('security.sso.manage', 'Manage Tenant SSO Configuration', 'security', 'TENANT', 'Grants management access to configure SAML 2.0 / OIDC SSO and domain routing', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 3b. SYSTEM Scope Permissions
INSERT INTO permissions (code, name, module, scope, description, created_at, updated_at) VALUES
    ('system.security.sso.manage', 'Manage Platform Global SSO Settings', 'system', 'SYSTEM', 'Grants management access to global platform identity federation and SSO defaults', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 4. Grant Permissions to System Roles (super_admin)
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE p.code IN ('security.sso.view', 'security.sso.manage', 'system.security.sso.manage')
  AND r.name = 'super_admin' AND r.scope = 'SYSTEM'
ON CONFLICT (permission_id, role_id) DO NOTHING;

-- 5. Grant Permissions to Tenant Template Role (admin)
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE p.code IN ('security.sso.view', 'security.sso.manage')
  AND r.name = 'admin' AND r.scope = 'TENANT'
ON CONFLICT (permission_id, role_id) DO NOTHING;

