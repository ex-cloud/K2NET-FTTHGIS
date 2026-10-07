-- V51__project_zones_and_topology_lifecycle.sql
-- Fase B: Perancangan Model Zona & Stage Topology (PLANNING -> CONSTRUCTION -> LIVE)

-- 1. Buat tabel project_zones
CREATE TABLE IF NOT EXISTS project_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    stage VARCHAR(30) NOT NULL DEFAULT 'PLANNING' CHECK (stage IN ('PLANNING', 'CONSTRUCTION', 'LIVE')),
    boundary_geom geometry(Polygon, 4326) NOT NULL,
    target_homepass INT DEFAULT 0,
    description TEXT,
    color VARCHAR(20) DEFAULT '#3b82f6',
    promoted_to_construction_at TIMESTAMP,
    promoted_to_live_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(255),
    CONSTRAINT uk_project_zones_project_code UNIQUE (project_id, code)
);

-- 2. Buat tabel audit envers project_zones_aud
CREATE TABLE IF NOT EXISTS project_zones_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    organization_id UUID,
    project_id UUID,
    name VARCHAR(255),
    code VARCHAR(50),
    stage VARCHAR(30),
    boundary_geom geometry(Polygon, 4326),
    target_homepass INT,
    description TEXT,
    color VARCHAR(20),
    promoted_to_construction_at TIMESTAMP,
    promoted_to_live_at TIMESTAMP,
    created_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP,
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(255),
    PRIMARY KEY (rev, id)
);

-- 3. Tambahkan foreign key zone_id ke tabel network_nodes & network_nodes_aud
ALTER TABLE network_nodes 
    ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES project_zones(id) ON DELETE SET NULL;

ALTER TABLE network_nodes_aud 
    ADD COLUMN IF NOT EXISTS zone_id UUID;

-- 4. Tambahkan foreign key zone_id ke tabel network_edges & network_edges_aud
ALTER TABLE network_edges 
    ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES project_zones(id) ON DELETE SET NULL;

ALTER TABLE network_edges_aud 
    ADD COLUMN IF NOT EXISTS zone_id UUID;

-- 5. Indeks Spasial GIST & Komposit Performa
CREATE INDEX IF NOT EXISTS idx_project_zones_boundary 
    ON project_zones USING GIST (boundary_geom);

CREATE INDEX IF NOT EXISTS idx_project_zones_project_stage 
    ON project_zones (project_id, stage) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_project_zones_org 
    ON project_zones (organization_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_network_nodes_zone 
    ON network_nodes (zone_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_network_edges_zone 
    ON network_edges (zone_id) WHERE deleted_at IS NULL;

-- 6. Daftarkan Permissions Granular PBAC (Scope: TENANT)
INSERT INTO permissions (code, name, module, scope, description, created_at, updated_at) VALUES
    ('zones.view', 'View Project Coverage Zones', 'coverage', 'TENANT', 'Melihat polygon zona wilayah cakupan, stage, dan kalkulasi BoQ material', NOW(), NOW()),
    ('zones.create', 'Create Project Zone', 'coverage', 'TENANT', 'Merancang dan membuat polygon zona cakupan baru dalam proyek', NOW(), NOW()),
    ('zones.edit', 'Edit Project Zone', 'coverage', 'TENANT', 'Mengubah nama, batas spasial polygon, warna, dan target homepass zona', NOW(), NOW()),
    ('zones.promote', 'Promote / Demote Zone Lifecycle Stage', 'coverage', 'TENANT', 'Menaikkan atau menurunkan tahap teknis zona (PLANNING <-> CONSTRUCTION <-> LIVE) yang berdampak ke kuota ODP', NOW(), NOW()),
    ('zones.delete', 'Delete Project Zone', 'coverage', 'TENANT', 'Menghapus zona wilayah cakupan dan memproses pelepasan atau penghapusan aset terkait', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    module = EXCLUDED.module,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 7. Mapping Permissions ke Default Tenant Roles (super_admin, admin, supervisor)
INSERT INTO role_permissions (permission_id, role_id)
SELECT p.id, r.id FROM roles r, permissions p
WHERE p.code IN ('zones.view', 'zones.create', 'zones.edit', 'zones.promote', 'zones.delete')
  AND r.name IN ('super_admin', 'admin', 'supervisor')
ON CONFLICT DO NOTHING;
