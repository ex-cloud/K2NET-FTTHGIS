-- Migration: Create scheduler tables
-- Run once manually or via application startup

CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cron_expr VARCHAR(100) NOT NULL,
    job_type VARCHAR(100) NOT NULL,
    payload JSONB,
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_tenant ON scheduled_jobs(tenant_slug);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_active ON scheduled_jobs(is_active);

CREATE TABLE IF NOT EXISTS job_execution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
    tenant_slug VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'queued', -- queued, running, done, failed
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_history_job_id ON job_execution_history(job_id);
CREATE INDEX IF NOT EXISTS idx_job_history_tenant ON job_execution_history(tenant_slug);
