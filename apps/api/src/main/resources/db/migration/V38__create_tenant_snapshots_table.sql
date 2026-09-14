-- Migration V38: Create tenant_snapshots table for tenant-scoped backup archives
CREATE TABLE IF NOT EXISTS tenant_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    snapshot_type VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    size_bytes BIGINT NOT NULL DEFAULT 0,
    postgis_entity_count BIGINT NOT NULL DEFAULT 0,
    sha256 VARCHAR(64) NOT NULL,
    minio_status VARCHAR(50) DEFAULT 'SYNCED',
    nextcloud_status VARCHAR(50) DEFAULT 'SYNCED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_snapshots_org_created ON tenant_snapshots(organization_id, created_at DESC);
