-- ==============================================================================
-- Flyway Migration V24: Create AI Agent Authorizations Table
-- Implements Cloudflare-style Zero-Trust Onboarding & Granular Permissions
-- ==============================================================================

CREATE TABLE IF NOT EXISTS ai_agent_authorizations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,
    tenant_id           UUID NOT NULL,
    user_scope          VARCHAR(30) NOT NULL DEFAULT 'PLATFORM_INTERNAL', -- PLATFORM_INTERNAL vs TENANT
    user_role           VARCHAR(50) NOT NULL DEFAULT 'SUPER_ADMIN',
    agent_name          VARCHAR(50) NOT NULL DEFAULT 'K2 Agent',
    access_tier         VARCHAR(30) NOT NULL DEFAULT 'FULL',              -- FULL, READ_ONLY, ROLE_PRESET, CUSTOM
    role_preset         VARCHAR(50),                                      -- DEVOPS, NOC, GIS, FINANCE, SECURITY, SUPPORT, ISP_OWNER, TECHNICIAN, CS
    granted_permissions TEXT[] NOT NULL DEFAULT '{}',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ai_agent_user_tenant UNIQUE (user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_agent_auth ON ai_agent_authorizations(user_id, tenant_id, user_scope, is_active);

-- Seed default initial authorization for Super Admin root context
INSERT INTO ai_agent_authorizations (
    user_id,
    tenant_id,
    user_scope,
    user_role,
    agent_name,
    access_tier,
    role_preset,
    granted_permissions,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'PLATFORM_INTERNAL',
    'SUPER_ADMIN',
    'K2 Agent',
    'FULL',
    'SUPER_ADMIN',
    ARRAY[
        'infra:metrics:read', 'infra:services:restart', 'infra:backup:read', 'infra:backup:trigger', 'infra:kong:read', 'infra:kong:reload',
        'noc:telemetry:global', 'noc:poller:diagnose', 'noc:upstream:monitor', 'noc:link:reboot',
        'gis:topology:audit', 'gis:basemap:manage', 'gis:boundary:validate', 'gis:export:master',
        'finance:revenue:read', 'finance:subscription:write', 'finance:reconcile:write', 'finance:invoice:audit',
        'iam:sessions:read', 'iam:roles:manage', 'iam:audit:read', 'iam:audit:export',
        'support:tenant:lookup', 'support:tickets:sync', 'support:sop:master', 'support:troubleshoot:exec'
    ],
    TRUE
) ON CONFLICT (user_id, tenant_id) DO NOTHING;
