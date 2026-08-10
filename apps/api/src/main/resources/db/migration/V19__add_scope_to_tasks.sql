-- ============================================================
-- V19: Add task_scope column to tasks table
-- Scope determines visibility across portals (Air-Gapped SaaS).
--
-- PLATFORM_INTERNAL  → studio-admin only (K2NET internal projects & DevOps alerts)
-- TENANT_TO_PLATFORM → studio-admin inbox + studio-tenant outbox (B2B support)
-- TENANT_INTERNAL    → studio-tenant only, isolated per organization_id (B2C)
-- ============================================================

-- Create PostgreSQL enum type
CREATE TYPE task_scope_enum AS ENUM (
    'PLATFORM_INTERNAL',
    'TENANT_TO_PLATFORM',
    'TENANT_INTERNAL'
);

-- Add scope column, default to PLATFORM_INTERNAL for all existing tasks
-- (They were created via studio-admin by Super Admin)
ALTER TABLE tasks
    ADD COLUMN scope task_scope_enum NOT NULL DEFAULT 'PLATFORM_INTERNAL';

-- Indexes for performant scope-based filtering
CREATE INDEX idx_tasks_scope ON tasks (scope);
CREATE INDEX idx_tasks_org_scope ON tasks (organization_id, scope);

-- Audit table: add scope column to tasks_aud as well
ALTER TABLE tasks_aud
    ADD COLUMN scope task_scope_enum;
