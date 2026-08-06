-- Add sync status columns to database_backups table for DevOps observability
ALTER TABLE database_backups 
ADD COLUMN IF NOT EXISTS minio_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS minio_sync_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS nextcloud_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS nextcloud_sync_time TIMESTAMP WITH TIME ZONE;
