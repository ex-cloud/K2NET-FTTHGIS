export interface TenantSnapshot {
  id: string;
  filename: string;
  type: "SCHEDULED" | "MANUAL" | "PRE_MAINTENANCE";
  sizeBytes: number;
  postgisEntityCount: number;
  sha256: string;
  createdAt: string;
  minioStatus: "SYNCED" | "PENDING";
  nextcloudStatus: "SYNCED" | "QUEUED";
}

export function formatBackupFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
