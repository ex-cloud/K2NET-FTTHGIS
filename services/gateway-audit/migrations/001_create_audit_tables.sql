-- Migration: Create audit_events tables and immutability rules

CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug VARCHAR(100) NOT NULL,
    actor_id VARCHAR(255) NOT NULL,
    actor_role VARCHAR(100),
    actor_ip VARCHAR(50), -- text to avoid ip formatting exceptions during validation
    action VARCHAR(50) NOT NULL,       -- DELETE, UPDATE, LOGIN, EXPORT
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    metadata JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_events(tenant_slug, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_events(actor_id, occurred_at DESC);

-- Immutability Rules: Prevent UPDATES and DELETES on audit logs
CREATE OR REPLACE RULE no_update_audit AS ON UPDATE TO audit_events DO INSTEAD NOTHING;
CREATE OR REPLACE RULE no_delete_audit AS ON DELETE TO audit_events DO INSTEAD NOTHING;
