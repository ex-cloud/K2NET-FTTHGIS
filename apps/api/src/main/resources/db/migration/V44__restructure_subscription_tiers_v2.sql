-- ============================================================
-- Flyway Migration V44: Restructure Subscription Tiers V2 (4-Tier Architecture)
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
    'Starter 14-day evaluation trial with basic hardware quotas and standard community support.',
    0.00,
    1,
    50,
    10,
    100,
    FALSE,
    FALSE
),
(
    '00000000-0000-0000-0001-000000000004',
    'STARTER',
    'Starter ISP tier for local ISPs and RT-RW Net with 2 OLTs and up to 500 customers.',
    990000.00,
    2,
    300,
    50,
    500,
    FALSE,
    TRUE
),
(
    '00000000-0000-0000-0001-000000000002',
    'PRO',
    'Professional ISP tier with dedicated SNMP poller, optical heatmap, LDAP SSO, and Gold 99.5% SLA.',
    3900000.00,
    6,
    2500,
    500,
    5000,
    TRUE,
    TRUE
),
(
    '00000000-0000-0000-0001-000000000003',
    'ENTERPRISE',
    'Enterprise Core tier with AI Fiber Copilot, custom POP gateway, custom domain, and Platinum 99.9% SLA.',
    12500000.00,
    25,
    12000,
    2000,
    25000,
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
