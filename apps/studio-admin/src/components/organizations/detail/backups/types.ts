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
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
