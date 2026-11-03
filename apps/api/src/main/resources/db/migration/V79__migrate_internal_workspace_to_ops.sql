-- ==============================================================================
-- V79__migrate_internal_workspace_to_ops.sql
-- K2NET FTTH GIS: Transition K2NET Operational Workspace from legacy 'default'
-- to 'ops' (https://ops.kdua.net), add semantic is_platform_root flag,
-- activate all 21 Marketplace Packages permanently, normalize SYSTEM users,
-- and synchronize Hibernate Envers audit tables (organizations_aud & tenant_package_subscriptions_aud).
-- ==============================================================================

-- 1. Add semantic is_platform_root column to organizations and organizations_aud
ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS is_platform_root BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE organizations_aud
    ADD COLUMN IF NOT EXISTS is_platform_root BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_organizations_platform_root
    ON organizations (is_platform_root)
    WHERE is_platform_root = true;

-- 2. Migrate root organization from legacy 'default' to 'ops' (K2NET Network Operations)
UPDATE organizations
SET slug = 'ops',
    name = 'K2NET Network Operations',
    description = 'K2NET Internal FTTH Network Operations & Commercial Showcase Workspace',
    realm_key = 'k2net-tenants',
    status = 'ACTIVE',
    is_platform_root = true,
    plan_id = COALESCE(
        (SELECT id FROM subscription_plans WHERE UPPER(name) = 'ENTERPRISE' LIMIT 1),
        plan_id
    )
WHERE slug IN ('default', 'ops')
   OR id = '00000000-0000-0000-0000-000000000001'::uuid;

-- 3. Purge legacy 'default' slug alias so default.kdua.net is strictly 404 (not guessable)
DELETE FROM organization_slug_aliases
WHERE LOWER(old_slug) = 'default';

-- 4. Normalize Platform Internal (SYSTEM scope) users so they are never bound to a tenant organization_id
UPDATE users
SET organization_id = NULL,
    last_active_organization_id = NULL
WHERE role_id IN (
    SELECT id FROM roles WHERE scope = 'SYSTEM'
)
AND (organization_id IS NOT NULL OR last_active_organization_id IS NOT NULL);

-- 4b. Standardize system_settings for production vector tile endpoint & 30-min session idle timeout
UPDATE system_settings
SET config_value = 'https://api-gis.kdua.net/tiles/{z}/{x}/{y}.pbf',
    updated_at = NOW()
WHERE config_key = 'vector_tile_source'
  AND config_value LIKE 'http://localhost%';

UPDATE system_settings
SET config_value = '30',
    updated_at = NOW()
WHERE config_key = 'session_idle_timeout';

-- 5. Permanently activate all 21 Marketplace Packages (platform_packages) for the K2NET root organization ('ops')
INSERT INTO tenant_package_subscriptions (
    id,
    organization_id,
    package_id,
    status,
    granted_by,
    grant_notes,
    activated_at,
    expires_at,
    auto_renew,
    created_at,
    created_by,
    updated_at,
    updated_by
)
SELECT
    gen_random_uuid(),
    o.id,
    pp.id,
    'ACTIVE',
    'PLATFORM_ROOT_ENTITLEMENT',
    'Permanent full-stack operational entitlement for K2NET Network Operations (ops.kdua.net)',
    NOW(),
    NULL,
    true,
    NOW(),
    'flyway_v79_ops_migration',
    NOW(),
    'flyway_v79_ops_migration'
FROM organizations o
CROSS JOIN platform_packages pp
WHERE o.is_platform_root = true
  AND NOT EXISTS (
      SELECT 1
      FROM tenant_package_subscriptions tps
      WHERE tps.organization_id = o.id
        AND tps.package_id = pp.id
  );

-- Ensure any existing package subscriptions on the root organization are set to ACTIVE
UPDATE tenant_package_subscriptions
SET status = 'ACTIVE',
    expires_at = NULL,
    auto_renew = true,
    updated_at = NOW(),
    updated_by = 'flyway_v79_ops_migration'
WHERE organization_id IN (
    SELECT id FROM organizations WHERE is_platform_root = true
)
AND status != 'ACTIVE';

-- 6. Synchronize Hibernate Envers Audit Trail (organizations_aud & tenant_package_subscriptions_aud)
-- STRICT ENVERS SCHEMA RULES:
--   - rev INTEGER NOT NULL REFERENCES revinfo(id)
--   - revtype SMALLINT (0=ADD, 1=MOD, 2=DEL)
--   - PRIMARY KEY (rev, id)
DO $$
DECLARE
    v_rev INTEGER;
    v_timestamp BIGINT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'revinfo') THEN
        SELECT nextval('revinfo_seq') INTO v_rev;
        SELECT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT INTO v_timestamp;

        INSERT INTO revinfo (id, timestamp, username)
        VALUES (v_rev, v_timestamp, 'flyway_v79_ops_migration');

        -- 6a. Record modification (revtype = 1) in organizations_aud for platform root organization
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations_aud') THEN
            INSERT INTO organizations_aud (
                id, rev, revtype, name, slug, realm_key, description, address, website, logo_url,
                plan_id, status, trial_expires_at, grace_period_until, booster_odps, booster_olts,
                booster_expires_at, dunning_level, plan_cycle, over_quota_mode, slug_type,
                custom_domain, custom_domain_verified, is_platform_root
            )
            SELECT
                o.id, v_rev, 1, o.name, o.slug, o.realm_key, o.description, o.address, o.website, o.logo_url,
                o.plan_id, o.status, o.trial_expires_at, o.grace_period_until, o.booster_odps, o.booster_olts,
                o.booster_expires_at, o.dunning_level, o.plan_cycle, o.over_quota_mode, o.slug_type,
                o.custom_domain, o.custom_domain_verified, o.is_platform_root
            FROM organizations o
            WHERE o.is_platform_root = true
              AND NOT EXISTS (
                  SELECT 1 FROM organizations_aud oa
                  WHERE oa.id = o.id AND oa.is_platform_root = true AND oa.slug = o.slug
              )
            ON CONFLICT (rev, id) DO NOTHING;
        END IF;

        -- 6b. Record additions (revtype = 0) in tenant_package_subscriptions_aud
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_package_subscriptions_aud') THEN
            INSERT INTO tenant_package_subscriptions_aud (
                id, rev, revtype, organization_id, package_id, status, granted_by, grant_notes,
                activated_at, expires_at, auto_renew, last_invoice_id,
                created_at, created_by, updated_at, updated_by
            )
            SELECT
                tps.id, v_rev, 0, tps.organization_id, tps.package_id, tps.status, tps.granted_by, tps.grant_notes,
                tps.activated_at, tps.expires_at, tps.auto_renew, tps.last_invoice_id,
                tps.created_at, tps.created_by, tps.updated_at, tps.updated_by
            FROM tenant_package_subscriptions tps
            JOIN organizations o ON o.id = tps.organization_id
            WHERE o.is_platform_root = true
              AND tps.created_by = 'flyway_v79_ops_migration'
              AND NOT EXISTS (
                  SELECT 1 FROM tenant_package_subscriptions_aud ta
                  WHERE ta.id = tps.id AND ta.revtype = 0
              )
            ON CONFLICT (rev, id) DO NOTHING;
        END IF;

        -- 6c. Record deletions (revtype = 2) in organization_members_aud for SYSTEM-scoped users & master CLI account
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_members_aud') THEN
            INSERT INTO organization_members_aud (
                id, rev, revtype, user_id, organization_id, role_id, role_name, status,
                is_default, joined_at, invitation_token, invitation_expires_at,
                created_at, created_by, updated_at, updated_by
            )
            SELECT
                om.id, v_rev, 2, om.user_id, om.organization_id, om.role_id, om.role_name, om.status,
                om.is_default, om.joined_at, om.invitation_token, om.invitation_expires_at,
                om.created_at, om.created_by, om.updated_at, om.updated_by
            FROM organization_members om
            WHERE om.user_id IN (
                SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.scope = 'SYSTEM'
                UNION
                SELECT u2.id FROM users u2 WHERE u2.username = 'k2net-master-admin'
            )
            ON CONFLICT (id, rev) DO NOTHING;
        END IF;

        -- 6d. Record deletion (revtype = 2) in users_aud for orphan Keycloak master CLI account
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_aud') THEN
            INSERT INTO users_aud (
                rev, revtype, role_id, id, avatar_url, email, full_name, status, username,
                org_id, secondary_email, phone, job_title, last_login_at, last_login_ip,
                mfa_enabled, timezone, locale, last_active_organization_id
            )
            SELECT
                v_rev, 2, u.role_id, u.id, u.avatar_url, u.email, u.full_name, u.status, u.username,
                u.organization_id, u.secondary_email, u.phone, u.job_title, u.last_login_at, u.last_login_ip,
                u.mfa_enabled, u.timezone, u.locale, u.last_active_organization_id
            FROM users u
            WHERE u.username = 'k2net-master-admin'
            ON CONFLICT (rev, id) DO NOTHING;
        END IF;
    END IF;
END $$;

-- 7. Remove SYSTEM-scoped users from tenant organization_members and purge master CLI account from users
DELETE FROM organization_members
WHERE user_id IN (
    SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.scope = 'SYSTEM'
    UNION
    SELECT u2.id FROM users u2 WHERE u2.username = 'k2net-master-admin'
);

DELETE FROM users
WHERE username = 'k2net-master-admin';

