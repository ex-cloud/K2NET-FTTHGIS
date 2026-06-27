-- Migration to add scope column to roles and permissions tables
ALTER TABLE roles ADD COLUMN scope VARCHAR(20) NOT NULL DEFAULT 'TENANT';
ALTER TABLE permissions ADD COLUMN scope VARCHAR(20) NOT NULL DEFAULT 'TENANT';

-- Update scope for existing system roles and permissions
UPDATE roles SET scope = 'SYSTEM' WHERE name = 'super_admin';
UPDATE permissions SET scope = 'SYSTEM' WHERE code IN ('orgs.view', 'orgs.manage');
