-- ==============================================================================
-- Flyway Migration V85: Enterprise Module Registry & Feature Governance
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform (ADR-0018)
--
-- Goals:
--   1. Create platform_modules table (SSOT for all Platform & Tenant Modules).
--   2. Create platform_modules_aud Envers audit table (Strict Envers Parity).
--   3. Register system.modules.read and system.modules.manage permissions.
--   4. Seed initial 23 canonical business modules (8 SYSTEM + 15 TENANT).
-- ==============================================================================

-- 1. Create platform_modules Table
CREATE TABLE IF NOT EXISTS platform_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_key VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scope VARCHAR(20) NOT NULL CHECK (scope IN ('SYSTEM', 'TENANT')),
    category VARCHAR(64) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'IN_DEVELOPMENT', 'MAINTENANCE', 'DEPRECATED')),
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    min_plan_tier VARCHAR(30) NOT NULL DEFAULT 'FREE' CHECK (min_plan_tier IN ('FREE', 'STARTER', 'PRO', 'ENTERPRISE')),
    license_flag VARCHAR(64),
    service_target VARCHAR(100) NOT NULL DEFAULT 'backend:9090',
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_platform_modules_key ON platform_modules(module_key);
CREATE INDEX IF NOT EXISTS idx_platform_modules_scope ON platform_modules(scope);
CREATE INDEX IF NOT EXISTS idx_platform_modules_status ON platform_modules(status);
CREATE INDEX IF NOT EXISTS idx_platform_modules_category ON platform_modules(category);

-- 2. Create Envers Audit Table (platform_modules_aud)
-- STRICT ENVERS SCHEMA RULES:
--   - rev INTEGER NOT NULL REFERENCES revinfo(id)
--   - revtype SMALLINT (0=ADD, 1=MOD, 2=DEL)
--   - AuditableEntity columns: created_at, created_by, updated_at, updated_by
--   - PRIMARY KEY (id, rev)
CREATE TABLE IF NOT EXISTS platform_modules_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    module_key VARCHAR(64),
    name VARCHAR(255),
    description TEXT,
    scope VARCHAR(20),
    category VARCHAR(64),
    status VARCHAR(30),
    is_enabled BOOLEAN,
    min_plan_tier VARCHAR(30),
    license_flag VARCHAR(64),
    service_target VARCHAR(100),
    metadata_json JSONB,
    created_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(255),
    PRIMARY KEY (id, rev)
);

-- 3. Register PBAC Permissions for Module Registry Governance (SYSTEM Scope)
INSERT INTO permissions (code, name, module, scope, description, created_at, updated_at)
VALUES
    ('system.modules.read',   'View Enterprise Module Registry',               'platform', 'SYSTEM', 'Grants view access to the centralized enterprise module registry and service health', NOW(), NOW()),
    ('system.modules.manage', 'Manage Enterprise Module Registry & Kill-Switch','platform', 'SYSTEM', 'Grants administrative management access to enable/disable modules, toggle maintenance mode, and audit orphan modules', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Synchronize permissions_aud for new permissions
UPDATE permissions_aud SET module = 'platform' WHERE code IN ('system.modules.read', 'system.modules.manage');

-- Grant to super_admin and platform_engineer roles
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE p.code IN ('system.modules.read', 'system.modules.manage')
  AND r.name = 'super_admin' AND r.scope = 'SYSTEM'
ON CONFLICT (permission_id, role_id) DO NOTHING;

INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE p.code IN ('system.modules.read', 'system.modules.manage')
  AND r.name = 'platform_engineer' AND r.scope = 'SYSTEM'
ON CONFLICT (permission_id, role_id) DO NOTHING;

-- 4. Seed Canonical 23 Platform & Tenant Modules (Idempotent)
INSERT INTO platform_modules (module_key, name, description, scope, category, status, is_enabled, min_plan_tier, license_flag, service_target, metadata_json)
VALUES
    -- ── 8 SYSTEM SCOPE MODULES ────────────────────────────────────────────────
    ('platform',  'Platform Workspace & Issues',            'Engineering backlog, master specifications, architecture RFCs, and collaborative workspace', 'SYSTEM', 'PLATFORM_INFRA',     'ACTIVE', TRUE, 'FREE', NULL, 'backend:9090', '{"icon": "Briefcase"}'::jsonb),
    ('catalog',   'Product & Commercial Catalog',           'Platform pricing tiers, add-on packages, message templates, and commercial billing policies', 'SYSTEM', 'BILLING_COMMERCIAL', 'ACTIVE', TRUE, 'FREE', NULL, 'backend:9090', '{"icon": "Boxes"}'::jsonb),
    ('licensing', 'Ed25519 Cryptographic Licensing',        'Hardware quotas, cryptographic license tokens, and emergency security kill-switch engine',    'SYSTEM', 'SECURITY_GOV',      'ACTIVE', TRUE, 'FREE', NULL, 'backend:9090', '{"icon": "KeyRound"}'::jsonb),
    ('billing',   'Tenant Subscriptions & Invoicing',       'B2B tenant subscription management, billing cycles, invoice generation, and revenue KPIs',    'SYSTEM', 'BILLING_COMMERCIAL', 'ACTIVE', TRUE, 'FREE', NULL, 'payment-gateway:5002', '{"icon": "CreditCard"}'::jsonb),
    ('support',   'Tenant Escalation & Support',            'B2B customer support ticket dispatching, SLA tracking, and operational tenant escalations',   'SYSTEM', 'OPERATIONS_OLT',    'ACTIVE', TRUE, 'FREE', NULL, 'backend:9090', '{"icon": "Headset"}'::jsonb),
    ('security',  'Enterprise Security & IAM',              'Centralized Keycloak IAM, SSO federation, WebAuthn FIDO2 credentials, and PBAC role matrices', 'SYSTEM', 'SECURITY_GOV',      'ACTIVE', TRUE, 'FREE', NULL, 'gateway-auth:5014', '{"icon": "ShieldCheck"}'::jsonb),
    ('system',    'System Governance & Auditing',           'Platform configuration, immutable audit trail, automated backups, and multi-tenant isolation', 'SYSTEM', 'PLATFORM_INFRA',     'ACTIVE', TRUE, 'FREE', NULL, 'gateway-audit:5009', '{"icon": "Sliders"}'::jsonb),
    ('task',      'System Tasks & Semantic Sync',           'Obsidian markdown semantic sync worker, background scheduled tasks, and cron jobs',          'SYSTEM', 'PLATFORM_INFRA',     'ACTIVE', TRUE, 'FREE', NULL, 'gateway-task:5011', '{"icon": "ListTodo"}'::jsonb),

    -- ── 15 TENANT SCOPE MODULES ───────────────────────────────────────────────
    ('network',      'FTTH GIS Network Topology',           'Optical network topology, OLT/ODC/ODP nodes, fiber cable traces, and optical loss attenuation', 'TENANT', 'NETWORK_GIS',       'ACTIVE', TRUE, 'FREE', NULL, 'backend:9090', '{"icon": "Network"}'::jsonb),
    ('map',          'Spatial Map & Geocoding',             'Interactive vector map canvas, tile serving, and address geocoding interface',               'TENANT', 'NETWORK_GIS',       'ACTIVE', TRUE, 'FREE', NULL, 'map-gateway:5003', '{"icon": "MapPin"}'::jsonb),
    ('coverage',     'Coverage Zones & Lifecycle',          'Coverage polygon lifecycle stages, greenfield planning, and optical viability analysis',     'TENANT', 'NETWORK_GIS',       'ACTIVE', TRUE, 'STARTER', NULL, 'backend:9090', '{"icon": "Layers"}'::jsonb),
    ('projects',     'Project Areas & Optical Budgets',     'Engineering project areas, BoQ bill of quantities, and spatial project assignments',         'TENANT', 'NETWORK_GIS',       'ACTIVE', TRUE, 'FREE', NULL, 'backend:9090', '{"icon": "FolderKanban"}'::jsonb),
    ('inventory',    'Passive Optical Network Inventory',   'ODP ports, splitter ratios, fiber patch cords, and hardware terminal stock',                  'TENANT', 'OPERATIONS_OLT',    'ACTIVE', TRUE, 'FREE', NULL, 'backend:9090', '{"icon": "Warehouse"}'::jsonb),
    ('customer',     'Subscribers & Drop Cables',           'Broadband subscriber management, drop cable installation records, and optical power history', 'TENANT', 'OPERATIONS_OLT',    'ACTIVE', TRUE, 'STARTER', NULL, 'backend:9090', '{"icon": "Users"}'::jsonb),
    ('ticket',       'Trouble Tickets & Incidents',         'Field incident reports, fiber cut restoration dispatches, and subscriber trouble tickets',    'TENANT', 'OPERATIONS_OLT',    'ACTIVE', TRUE, 'STARTER', NULL, 'backend:9090', '{"icon": "Ticket"}'::jsonb),
    ('team',         'Team Members & Access Roles',         'Tenant organization team roster, granular role assignments, and member invitation workflows', 'TENANT', 'SECURITY_GOV',      'ACTIVE', TRUE, 'FREE', NULL, 'backend:9090', '{"icon": "UserCheck"}'::jsonb),
    ('organization', 'Workspace & Security Policies',       'Tenant identity preferences, whitelabel configuration, and social login policy toggles',      'TENANT', 'SECURITY_GOV',      'ACTIVE', TRUE, 'FREE', NULL, 'backend:9090', '{"icon": "Building2"}'::jsonb),
    ('integration',  'Developer REST API & Webhooks',       'External REST API access tokens, event webhooks, and third-party developer integrations',     'TENANT', 'PLATFORM_INFRA',     'ACTIVE', TRUE, 'PRO', 'api', 'backend:9090', '{"icon": "Code2"}'::jsonb),
    ('branding',     'Custom Domain & Whitelabel',          'Custom tenant apex/subdomain CNAME routing, white-label login portal, and tenant logos',      'TENANT', 'PLATFORM_INFRA',     'ACTIVE', TRUE, 'ENTERPRISE', 'custom_domain', 'backend:9090', '{"icon": "Sparkles"}'::jsonb),
    ('approval',     'Two-Person Rule Project Approvals',   'Multi-tier project approval workflows, civil excavation sign-offs, and audit enforcement',    'TENANT', 'SECURITY_GOV',      'ACTIVE', TRUE, 'PRO', NULL, 'backend:9090', '{"icon": "CheckSquare"}'::jsonb),
    ('report',       'Data Exports & Financial Analytics',  'Asynchronous Excel, CSV, and PDF report generation, spatial BoQ exports, and analytics',      'TENANT', 'BILLING_COMMERCIAL', 'ACTIVE', TRUE, 'PRO', NULL, 'gateway-export:5007', '{"icon": "FileSpreadsheet"}'::jsonb),
    ('dashboard',    'Operational Dashboard & Telemetry',   'High-level ISP operations dashboard, network status widgets, and spatial quick action cards', 'TENANT', 'PLATFORM_INFRA',     'ACTIVE', TRUE, 'FREE', NULL, 'backend:9090', '{"icon": "LayoutDashboard"}'::jsonb),
    ('audit',        'Immutable Activity Logs & Audit Trail','Centralized immutable activity log explorer, tamper-proof security auditing, and forensics',   'TENANT', 'SECURITY_GOV',      'ACTIVE', TRUE, 'STARTER', NULL, 'gateway-audit:5009', '{"icon": "ShieldAlert"}'::jsonb)
ON CONFLICT (module_key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    scope = EXCLUDED.scope,
    category = EXCLUDED.category,
    min_plan_tier = EXCLUDED.min_plan_tier,
    license_flag = EXCLUDED.license_flag,
    service_target = EXCLUDED.service_target,
    metadata_json = EXCLUDED.metadata_json,
    updated_at = NOW();
