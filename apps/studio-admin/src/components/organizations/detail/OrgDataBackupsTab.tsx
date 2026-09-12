import type { EnrichedOrganization } from "../types";
import { useOrgDataBackupsState } from "./backups/useOrgDataBackupsState";
import { BackupsHeaderBar } from "./backups/BackupsHeaderBar";
import { BackupStorageCards } from "./backups/BackupStorageCards";
import { BackupSnapshotsTable } from "./backups/BackupSnapshotsTable";

export type { TenantSnapshot } from "./backups/types";

interface OrgDataBackupsTabProps {
  organization: EnrichedOrganization;
  onOpenImportModal?: () => void;
}

export function OrgDataBackupsTab({
  organization: org,
  onOpenImportModal,
}: OrgDataBackupsTabProps) {
  const {
    triggering,
    snapshots,
    handleTriggerSnapshot,
    handleSpatialExport,
  } = useOrgDataBackupsState(org);

  return (
    <div className="space-y-6">
      {/* 1. Master Backup & Data Sovereignty Banner */}
      <BackupsHeaderBar
        onOpenImportModal={onOpenImportModal}
        onTriggerSnapshot={handleTriggerSnapshot}
        triggering={triggering}
      />

      {/* 2. 3-Layer Storage Status & Spatial Exporters */}
      <BackupStorageCards
        slug={org.slug}
        onSpatialExport={handleSpatialExport}
      />

      {/* 3. Snapshot History Table */}
      <BackupSnapshotsTable
        snapshots={snapshots}
        onDownloadSnapshot={handleTriggerSnapshot}
      />
    </div>
  );
}
