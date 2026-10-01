-- ==============================================================================
-- K2NET FTTH GIS — Dual-Layer Audit Log & Platform Observability Indexing
-- Migration: V46__add_audit_events_project_and_tenant_indexes.sql
-- ==============================================================================

-- 1. Pastikan tabel audit_events terdefinisi jika migrasi dijalankan mandiri
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug VARCHAR(100) NOT NULL,
    actor_id VARCHAR(255) NOT NULL,
    actor_role VARCHAR(100),
    actor_ip VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    metadata JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Aturan Baku Immutability Audit (Append-Only)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_rules WHERE rulename = 'no_update_audit' AND tablename = 'audit_events') THEN
        CREATE RULE no_update_audit AS ON UPDATE TO audit_events DO INSTEAD NOTHING;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_rules WHERE rulename = 'no_delete_audit' AND tablename = 'audit_events') THEN
        CREATE RULE no_delete_audit AS ON DELETE TO audit_events DO INSTEAD NOTHING;
    END IF;
END $$;

-- 3. Composite & Functional B-Tree Indexes untuk Super Admin & Tenant Observability

-- Global Timeline Index (Platform Super Admin Global Logs Explorer)
CREATE INDEX IF NOT EXISTS idx_audit_events_occurred_at 
    ON audit_events (occurred_at DESC);

-- Tenant Global Timeline Index (Organization Scope Audit Trail)
CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_occurred 
    ON audit_events (tenant_slug, occurred_at DESC);

-- Functional Composite Index: Project Scope Audit Trail (Layer 2 Operational)
CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_project 
    ON audit_events (tenant_slug, (metadata->>'projectId'), occurred_at DESC);

-- Functional Global Index: Log Group Taxonomy (CORE, OPERATIONS, NETWORK, MESSAGING)
CREATE INDEX IF NOT EXISTS idx_audit_events_group_occurred 
    ON audit_events (((metadata->>'logGroup')), occurred_at DESC);

-- Resource Type & Action Filtering Indexes per-Tenant
CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_resource 
    ON audit_events (tenant_slug, resource_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_action 
    ON audit_events (tenant_slug, action, occurred_at DESC);

-- Actor Activity Trail Index
CREATE INDEX IF NOT EXISTS idx_audit_events_actor 
    ON audit_events (actor_id, occurred_at DESC);
