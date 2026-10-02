-- Migration: Create audit_events partitioned tables and immutability rules

CREATE TABLE IF NOT EXISTS audit_events (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
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
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

-- Default safety-net partition
CREATE TABLE IF NOT EXISTS audit_events_default PARTITION OF audit_events DEFAULT;

-- Pre-allocated partitions
CREATE TABLE IF NOT EXISTS audit_events_y2026m06 PARTITION OF audit_events
    FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS audit_events_y2026m07 PARTITION OF audit_events
    FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS audit_events_y2026m08 PARTITION OF audit_events
    FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS audit_events_y2026m09 PARTITION OF audit_events
    FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS audit_events_y2026m10 PARTITION OF audit_events
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS audit_events_y2026m11 PARTITION OF audit_events
    FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS audit_events_y2026m12 PARTITION OF audit_events
    FOR VALUES FROM ('2026-12-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS audit_events_y2027m01 PARTITION OF audit_events
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-02-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS audit_events_y2027m02 PARTITION OF audit_events
    FOR VALUES FROM ('2027-02-01 00:00:00+00') TO ('2027-03-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS audit_events_y2027m03 PARTITION OF audit_events
    FOR VALUES FROM ('2027-03-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_events(tenant_slug, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_events(actor_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_occurred_at ON audit_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_project ON audit_events(tenant_slug, (metadata->>'projectId'), occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_group_occurred ON audit_events(((metadata->>'logGroup')), occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_type_occurred ON audit_events(((metadata->>'logType')), occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_severity_occurred ON audit_events(((metadata->>'severity')), occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_resource ON audit_events(tenant_slug, resource_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_action ON audit_events(tenant_slug, action, occurred_at DESC);

-- Immutability Trigger: Prevent UPDATES and DELETES on audit logs
CREATE OR REPLACE FUNCTION prevent_audit_events_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Security Policy Violation: audit_events are immutable and cannot be updated or deleted directly.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_events_mutation ON audit_events;
CREATE TRIGGER trg_prevent_audit_events_mutation
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW EXECUTE FUNCTION prevent_audit_events_mutation();
