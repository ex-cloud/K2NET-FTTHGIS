-- V34__backfill_legacy_project_id_and_add_spatial_permissions.sql
-- Fase 3: ABAC Spatial Enforcement & Backfill Legacy Project ID

-- 1. Daftarkan permission network.manage.all-projects (Scope: TENANT)
INSERT INTO permissions (code, name, module, scope, description, created_at, updated_at) VALUES
  ('network.manage.all-projects', 'Manage All Network Projects', 'network', 'TENANT', 'Akses penuh untuk mutasi dan kelola seluruh project dalam organisasi tenant (All-Projects tier)', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- 2. Mapping permission network.manage.all-projects ke role internal (super_admin, admin, supervisor)
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE p.code = 'network.manage.all-projects' AND r.name IN ('super_admin', 'admin', 'supervisor')
ON CONFLICT DO NOTHING;

-- 3. Buat default project "Legacy / Unassigned Assets" per organisasi yang memiliki aset tanpa project_id
INSERT INTO projects (id, organization_id, name, code, description, created_at, updated_at)
SELECT 
    gen_random_uuid(), 
    o.id, 
    'Legacy / Unassigned Assets', 
    'LEGACY-' || substring(o.id::text, 1, 8),
    'Auto-generated project for unassigned and legacy assets',
    NOW(), 
    NOW()
FROM organizations o
WHERE (
    EXISTS (SELECT 1 FROM network_nodes n WHERE n.organization_id = o.id AND n.project_id IS NULL)
    OR EXISTS (SELECT 1 FROM network_edges e WHERE e.organization_id = o.id AND e.project_id IS NULL)
)
AND NOT EXISTS (
    SELECT 1 FROM projects p WHERE p.organization_id = o.id AND p.name = 'Legacy / Unassigned Assets'
);

-- 4. Backfill update network_nodes yang masih project_id IS NULL
UPDATE network_nodes n
SET project_id = p.id, updated_at = NOW()
FROM projects p
WHERE n.project_id IS NULL
  AND n.organization_id = p.organization_id
  AND p.name = 'Legacy / Unassigned Assets';

-- 5. Backfill update network_edges yang masih project_id IS NULL
UPDATE network_edges e
SET project_id = p.id, updated_at = NOW()
FROM projects p
WHERE e.project_id IS NULL
  AND e.organization_id = p.organization_id
  AND p.name = 'Legacy / Unassigned Assets';

-- 6. Tambahkan unique composite index pada project_members(user_id, project_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_members_user_proj 
ON project_members(user_id, project_id);
