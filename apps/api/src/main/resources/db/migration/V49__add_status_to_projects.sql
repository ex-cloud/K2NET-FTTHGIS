-- Migration V49: Add status column to projects and projects_aud tables
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PRODUCTION';
ALTER TABLE projects_aud ADD COLUMN IF NOT EXISTS status VARCHAR(50);

-- Backfill any existing null status to PRODUCTION
UPDATE projects SET status = 'PRODUCTION' WHERE status IS NULL;
