-- ============================================================
-- Flyway Migration V27: Seed Canonical Subscription Plans
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
-- ============================================================

INSERT INTO subscription_plans (
    id, 
    name, 
    description, 
    price, 
    max_projects, 
    max_odps, 
    max_odcs, 
    max_customers, 
    has_sso, 
    has_api_access
) VALUES 
(
    '00000000-0000-0000-0001-000000000001',
    'FREE',
    'Starter 7-day evaluation trial with basic hardware quotas and standard community support.',
    0.00,
    2,
    500,
    100,
    1000,
    FALSE,
    FALSE
),
(
    '00000000-0000-0000-0001-000000000002',
    'PRO',
    'Professional ISP tier with dedicated poller, LDAP SSO, and Gold 99.5% SLA.',
    4900000.00,
    5,
    2500,
    500,
    5000,
    TRUE,
    TRUE
),
(
    '00000000-0000-0000-0001-000000000003',
    'ENTERPRISE',
    'Enterprise Core tier with AI Fiber Copilot, custom POP gateway, and Platinum 99.9% SLA.',
    14500000.00,
    20,
    10000,
    2000,
    20000,
    TRUE,
    TRUE
)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    max_projects = EXCLUDED.max_projects,
    max_odps = EXCLUDED.max_odps,
    max_odcs = EXCLUDED.max_odcs,
    max_customers = EXCLUDED.max_customers,
    has_sso = EXCLUDED.has_sso,
    has_api_access = EXCLUDED.has_api_access;

-- Assign default PRO plan to any existing organization that has NULL plan_id
UPDATE organizations
SET plan_id = '00000000-0000-0000-0001-000000000002'
WHERE plan_id IS NULL;
