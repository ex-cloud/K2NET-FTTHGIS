-- ==============================================================================
-- K2NET FTTH GIS — V58: Custom Domain & Whitelabel Branding Engine (PKG_TENANT_BRANDING)
-- Support for Multi-Tenant Custom Domains, DNS Handshake Verification, Theme Customization,
-- and Automated Edge Routing. Includes Hibernate Envers Audit Tables.
-- ==============================================================================

-- 1. Create tenant_branding table
CREATE TABLE IF NOT EXISTS tenant_branding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    custom_domain VARCHAR(255) UNIQUE,
    domain_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_DNS', -- PENDING_DNS, ACTIVE, FAILED
    cname_target VARCHAR(255) NOT NULL DEFAULT 'edge.kdua.net',
    verification_token VARCHAR(64) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    ssl_status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, ISSUED, FAILED
    ssl_issued_at TIMESTAMP WITH TIME ZONE,
    app_title VARCHAR(128),
    company_name VARCHAR(128),
    logo_url TEXT,
    favicon_url TEXT,
    brand_color_primary VARCHAR(32) DEFAULT '#2563EB',
    brand_color_accent VARCHAR(32) DEFAULT '#1D4ED8',
    footer_text VARCHAR(255),
    support_email VARCHAR(255),
    support_phone VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255),
    CONSTRAINT uk_tenant_branding_org UNIQUE (organization_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_branding_domain ON tenant_branding(custom_domain);
CREATE INDEX IF NOT EXISTS idx_tenant_branding_status ON tenant_branding(domain_status);

COMMENT ON TABLE tenant_branding IS 'Custom domain and whitelabel portal branding configurations per tenant organization';
COMMENT ON COLUMN tenant_branding.custom_domain IS 'FQDN for the tenant portal e.g. gis.isp-partner.net';
COMMENT ON COLUMN tenant_branding.verification_token IS 'Secret token for DNS CNAME or TXT validation';
COMMENT ON COLUMN tenant_branding.cname_target IS 'Platform edge router destination that tenant CNAME should point to';

-- 2. Create tenant_branding_aud table (Hibernate Envers Audit Table)
CREATE TABLE IF NOT EXISTS tenant_branding_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    organization_id UUID,
    custom_domain VARCHAR(255),
    domain_status VARCHAR(32),
    cname_target VARCHAR(255),
    verification_token VARCHAR(64),
    verified_at TIMESTAMP WITH TIME ZONE,
    ssl_status VARCHAR(32),
    ssl_issued_at TIMESTAMP WITH TIME ZONE,
    app_title VARCHAR(128),
    company_name VARCHAR(128),
    logo_url TEXT,
    favicon_url TEXT,
    brand_color_primary VARCHAR(32),
    brand_color_accent VARCHAR(32),
    footer_text VARCHAR(255),
    support_email VARCHAR(255),
    support_phone VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(255),
    PRIMARY KEY (rev, id)
);

-- 3. Register granular permission and assign to canonical admin roles
INSERT INTO permissions (code, name, description, module, scope, created_at, updated_at)
VALUES (
    'feature.branding.whitelabel',
    'Custom Domain & Whitelabel Branding Access',
    'Permission to configure custom domains, tenant logos, color theming, and portal identity',
    'branding',
    'TENANT',
    NOW(),
    NOW()
) ON CONFLICT (code) DO NOTHING;

-- Grant to 'admin' system tenant role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' AND r.is_system_role = TRUE
  AND p.code = 'feature.branding.whitelabel'
ON CONFLICT DO NOTHING;

-- Grant to 'super_admin' system role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin' AND r.is_system_role = TRUE
  AND p.code = 'feature.branding.whitelabel'
ON CONFLICT DO NOTHING;
