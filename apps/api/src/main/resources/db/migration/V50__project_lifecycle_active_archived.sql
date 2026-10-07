-- ============================================================
-- Flyway Migration V50: Project Lifecycle (ACTIVE / ARCHIVED) & Quota Guard
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
-- ============================================================

-- 1. Normalisasi status proyek lama ke 'ACTIVE' & tambahkan CHECK constraint
UPDATE projects 
SET status = 'ACTIVE' 
WHERE status IS NULL OR status NOT IN ('ACTIVE', 'ARCHIVED');

ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'ACTIVE';

ALTER TABLE projects DROP CONSTRAINT IF EXISTS chk_projects_status;
ALTER TABLE projects ADD CONSTRAINT chk_projects_status CHECK (status IN ('ACTIVE', 'ARCHIVED'));

-- 2. Tambahkan kolom audit pengarsipan pada tabel projects & projects_aud
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived_by VARCHAR(255);

ALTER TABLE projects_aud ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
ALTER TABLE projects_aud ADD COLUMN IF NOT EXISTS archived_by VARCHAR(255);

-- 3. Tambahkan kolom max_archived_projects pada subscription_plans & subscription_plans_aud
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_archived_projects INT DEFAULT 1;
ALTER TABLE subscription_plans_aud ADD COLUMN IF NOT EXISTS max_archived_projects INT DEFAULT 1;

UPDATE subscription_plans SET max_archived_projects = 1 WHERE name = 'FREE';
UPDATE subscription_plans SET max_archived_projects = 2 WHERE name = 'STARTER';
UPDATE subscription_plans SET max_archived_projects = 6 WHERE name = 'PRO';
UPDATE subscription_plans SET max_archived_projects = 25 WHERE name = 'ENTERPRISE';

-- 4. Registrasi permission projects.archive dan mapping ke role admin, supervisor, super_admin
INSERT INTO permissions (name, code, module, scope, description, created_at, updated_at)
VALUES ('Archive / Unarchive Projects', 'projects.archive', 'projects', 'TENANT', 'Allows archiving and restoring tenant projects', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name IN ('admin', 'supervisor', 'super_admin') 
  AND p.code = 'projects.archive'
ON CONFLICT DO NOTHING;

-- 5. Partial index untuk query performa proyek aktif vs terarsip per organisasi
CREATE INDEX IF NOT EXISTS idx_projects_org_status ON projects(organization_id, status) WHERE deleted_at IS NULL;

-- 6. Normalisasi config key max_olts -> max_projects jika ada
UPDATE organization_configs SET config_key = 'max_projects' WHERE config_key = 'max_olts';
