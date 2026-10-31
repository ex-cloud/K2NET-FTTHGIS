-- ==============================================================================
-- Flyway Migration V74: Typed Tenant Security Policies and Baseline Keys
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Goals:
--   1. Create typed tenant_security_policies table and its Envers audit table.
--   2. Seed default policies for existing organizations.
--   3. Register granular PBAC permissions for Platform & Tenant Security Policies.
--   4. Seed new platform security baseline keys in system_settings.
-- ==============================================================================

-- 1. Create tenant_security_policies Table
CREATE TABLE IF NOT EXISTS tenant_security_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    mfa_enforced BOOLEAN NOT NULL DEFAULT FALSE,
    allowed_methods VARCHAR(255) NOT NULL DEFAULT 'totp,webauthn',
    grace_period_days INT NOT NULL DEFAULT 7,
    session_idle_minutes INT NOT NULL DEFAULT 30,
    device_verification_required BOOLEAN NOT NULL DEFAULT FALSE,
    ip_allowlist_cidrs TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_sec_policy_org ON tenant_security_policies(organization_id);

-- 2. Create Envers Audit Table (tenant_security_policies_aud)
CREATE TABLE IF NOT EXISTS tenant_security_policies_aud (
    id UUID NOT NULL,
    rev BIGINT NOT NULL,
    revtype SMALLINT,
    organization_id UUID,
    mfa_enforced BOOLEAN,
    allowed_methods VARCHAR(255),
    grace_period_days INT,
    session_idle_minutes INT,
    device_verification_required BOOLEAN,
    ip_allowlist_cidrs TEXT,
    PRIMARY KEY (id, rev)
);

-- 3. Seed Default Policy for All Existing Organizations
INSERT INTO tenant_security_policies (organization_id, mfa_enforced, allowed_methods, grace_period_days, session_idle_minutes, device_verification_required)
SELECT id, FALSE, 'totp,webauthn', 7, 30, FALSE
FROM organizations
ON CONFLICT (organization_id) DO NOTHING;

-- 4. Register Granular PBAC Permissions
-- 4a. SYSTEM Scope Permissions
INSERT INTO permissions (code, name, module, scope, description, created_at, updated_at) VALUES
    ('system.security.policy.view',   'View Platform Security Policies',   'system', 'SYSTEM', 'Grants view access to platform global baseline security policies and defaults', NOW(), NOW()),
    ('system.security.policy.manage', 'Manage Platform Security Policies', 'system', 'SYSTEM', 'Grants management access to configure global MFA, password policy, and session baselines', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 4b. TENANT Scope Permissions
INSERT INTO permissions (code, name, module, scope, description, created_at, updated_at) VALUES
    ('security.policy.view',   'View Tenant Security Policy',   'security', 'TENANT', 'Grants view access to tenant organization MFA enforcement and session policies', NOW(), NOW()),
    ('security.policy.manage', 'Manage Tenant Security Policy', 'security', 'TENANT', 'Grants management access to configure tenant organization MFA enforcement and session policies', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 5. Grant Permissions to System Roles (super_admin gets both)
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE p.code IN ('system.security.policy.view', 'system.security.policy.manage')
  AND r.name = 'super_admin' AND r.scope = 'SYSTEM'
ON CONFLICT (permission_id, role_id) DO NOTHING;

-- 6. Grant Permissions to Tenant Template Roles (admin gets tenant permissions)
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE p.code IN ('security.policy.view', 'security.policy.manage')
  AND r.name = 'admin' AND r.scope = 'TENANT'
ON CONFLICT (permission_id, role_id) DO NOTHING;

-- 7. Seed Baseline Platform Security Settings into system_settings
INSERT INTO system_settings (config_key, config_value, category, description, created_at, updated_at) VALUES
    ('security.mfa.allowed_methods', 'totp,webauthn', 'SECURITY', 'Comma-separated list of allowed MFA mechanisms on platform (totp,webauthn)', NOW(), NOW()),
    ('security.mfa.grace_period_days', '7', 'SECURITY', 'Default grace period in days for new users to complete MFA enrollment', NOW(), NOW()),
    ('security.mfa.tenant_can_enforce', 'true', 'SECURITY', 'Whether tenant admins are permitted to enforce MFA for their organization', NOW(), NOW()),
    ('security.device_verification_enabled', 'false', 'SECURITY', 'Whether step-up OTP device verification is globally enabled for new devices', NOW(), NOW()),
    ('security.ip_allowlist.tenant_allowed', 'true', 'SECURITY', 'Whether tenant admins are permitted to configure IP CIDR allowlists', NOW(), NOW())
ON CONFLICT (config_key) DO NOTHING;

