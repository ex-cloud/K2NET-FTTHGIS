-- ============================================================
-- V20: Convert scope column from custom enum to VARCHAR(30)
-- Standardizes the task scope column to stay Hibernate-friendly
-- matching status and priority fields.
-- ============================================================

-- 1. Alter tasks table scope column type to VARCHAR(30)
ALTER TABLE tasks ALTER COLUMN scope TYPE VARCHAR(30);

-- 2. Add CHECK constraint for scope
ALTER TABLE tasks ADD CONSTRAINT chk_tasks_scope CHECK (scope IN ('PLATFORM_INTERNAL', 'TENANT_TO_PLATFORM', 'TENANT_INTERNAL'));

-- 3. Alter tasks_aud (audit table) scope column type to VARCHAR(30)
ALTER TABLE tasks_aud ALTER COLUMN scope TYPE VARCHAR(30);

-- 4. Clean up the unused task_scope_enum type (cascades to drop implicit casts if any)
DROP TYPE IF EXISTS task_scope_enum CASCADE;

-- 5. Restore DEFAULT value for tasks.scope column which was dropped by type alteration cascade
ALTER TABLE tasks ALTER COLUMN scope SET DEFAULT 'PLATFORM_INTERNAL';
