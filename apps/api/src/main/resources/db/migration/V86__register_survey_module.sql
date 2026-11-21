-- ==============================================================================
-- Flyway Migration V86: Register Survey Module in Platform Module Registry
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform (ADR-0019)
--
-- Goals:
--   1. Register 'survey' module (Optical Field Survey & Feasibility) in platform_modules.
--   2. Maintain Envers parity by auditing the registration in platform_modules_aud.
--   3. Reconcile survey.create permission mapping to eliminate orphan alerts.
-- ==============================================================================

-- 1. Insert 'survey' Module into platform_modules (Idempotent)
INSERT INTO platform_modules (
    module_key,
    name,
    description,
    scope,
    category,
    status,
    is_enabled,
    min_plan_tier,
    license_flag,
    service_target,
    metadata_json
)
VALUES (
    'survey',
    'Optical Field Survey & Feasibility',
    'Field optical route feasibility surveys, site survey capture, and engineering route inspections',
    'TENANT',
    'NETWORK_GIS',
    'ACTIVE',
    TRUE,
    'STARTER',
    NULL,
    'backend:9090',
    '{"icon": "Compass"}'::jsonb
)
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

-- 2. Audit in platform_modules_aud for Strict Envers Parity
-- Retrieve the latest revision from revinfo or insert baseline rev
DO $$
DECLARE
    v_rev_id INTEGER;
    v_module_id UUID;
BEGIN
    SELECT id INTO v_module_id FROM platform_modules WHERE module_key = 'survey';
    SELECT id INTO v_rev_id FROM revinfo ORDER BY id DESC LIMIT 1;

    IF v_rev_id IS NOT NULL AND v_module_id IS NOT NULL THEN
        -- Only insert audit row if not already present for this rev
        IF NOT EXISTS (SELECT 1 FROM platform_modules_aud WHERE id = v_module_id AND rev = v_rev_id) THEN
            INSERT INTO platform_modules_aud (
                id, rev, revtype, module_key, name, description, scope,
                category, status, is_enabled, min_plan_tier, license_flag,
                service_target, metadata_json, created_at, updated_at
            )
            VALUES (
                v_module_id, v_rev_id, 0, 'survey',
                'Optical Field Survey & Feasibility',
                'Field optical route feasibility surveys, site survey capture, and engineering route inspections',
                'TENANT', 'NETWORK_GIS', 'ACTIVE', TRUE, 'STARTER', NULL,
                'backend:9090', '{"icon": "Compass"}'::jsonb, NOW(), NOW()
            );
        END IF;
    END IF;
END $$;
