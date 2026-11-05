-- ==============================================================================
-- Flyway Migration V81: SSO Discovery Index & Identity Governance Hardening
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Goals:
--   1. Create GIN index on organization_sso_configs.domain_mappings for ultra-fast HRD.
--   2. Ensure index on tenant_security_policies.organization_id.
-- ==============================================================================

-- 1. GIN index for domain-based Home Realm Discovery (HRD) JSONB containment
CREATE INDEX IF NOT EXISTS idx_org_sso_configs_domains 
ON organization_sso_configs USING gin (domain_mappings);

-- 2. Index for tenant security policy lookup
CREATE INDEX IF NOT EXISTS idx_tenant_sec_policy_org_lookup 
ON tenant_security_policies(organization_id);

