-- ==============================================================================
-- K2NET FTTH GIS — Enterprise CQRS Materialized Summary Views for Audit Logs
-- Migration: V48__create_audit_events_summary_materialized_view.sql
-- ==============================================================================

-- 1. Create Hourly Materialized Summary View for Instant Analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_audit_events_hourly_summary AS
SELECT 
    tenant_slug,
    COALESCE(metadata->>'logGroup', 'CORE') AS log_group,
    COALESCE(metadata->>'logType', 'unknown') AS log_type,
    COALESCE(metadata->>'severity', 'INFO') AS severity,
    DATE_TRUNC('hour', occurred_at) AS event_hour,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE metadata->>'severity' = 'CRITICAL' OR metadata->>'severity' = 'ERROR') AS error_count,
    MAX(occurred_at) AS last_event_at
FROM audit_events
GROUP BY 
    tenant_slug,
    COALESCE(metadata->>'logGroup', 'CORE'),
    COALESCE(metadata->>'logType', 'unknown'),
    COALESCE(metadata->>'severity', 'INFO'),
    DATE_TRUNC('hour', occurred_at);

-- 2. Indexes on Materialized View for Fast CQRS Queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_audit_summary_unique
    ON mv_audit_events_hourly_summary (tenant_slug, log_group, log_type, severity, event_hour);

CREATE INDEX IF NOT EXISTS idx_mv_audit_summary_tenant_hour
    ON mv_audit_events_hourly_summary (tenant_slug, event_hour DESC);

CREATE INDEX IF NOT EXISTS idx_mv_audit_summary_group_hour
    ON mv_audit_events_hourly_summary (log_group, event_hour DESC);

-- 3. Stored Procedure for Concurrent Background Refresh
CREATE OR REPLACE FUNCTION refresh_audit_events_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_audit_events_hourly_summary;
END;
$$ LANGUAGE plpgsql;
