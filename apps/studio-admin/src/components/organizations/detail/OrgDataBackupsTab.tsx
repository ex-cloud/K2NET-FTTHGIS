import type { EnrichedOrganization } from "../types";
import { useOrgDataBackupsState } from "./backups/useOrgDataBackupsState";
import { BackupsHeaderBar } from "./backups/BackupsHeaderBar";
import { BackupStorageCards } from "./backups/BackupStorageCards";
import { BackupSnapshotsTable } from "./backups/BackupSnapshotsTable";
import { BackupProgressModal } from "./backups/BackupProgressModal";

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
    restoring,
    loadingSnapshots,
    snapshots,
    handleTriggerSnapshot,
    handleSpatialExport,
    handleRestoreSnapshot,
    isBackupModalOpen,
    backupProgress,
    backupStage,
    backupStatus,
    backupError,
    terminalLogs,
    downloadFileName,
    handleDownloadAgain,
    closeBackupModal,
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
        slug={org.slug || org.id}
        onSpatialExport={handleSpatialExport}
      />

      {/* 3. Snapshot History Table */}
      <BackupSnapshotsTable
        snapshots={snapshots}
        loading={loadingSnapshots}
        restoring={restoring}
        onDownloadSnapshot={handleTriggerSnapshot}
        onRestoreSnapshot={handleRestoreSnapshot}
      />

      {/* 4. Live Informative Backup Pipeline Modal (Step-by-Step HUD) */}
      <BackupProgressModal
        isOpen={isBackupModalOpen}
        onClose={closeBackupModal}
        orgName={org.name}
        orgSlug={org.slug || org.id}
        progress={backupProgress}
        currentStage={backupStage}
        status={backupStatus}
        error={backupError}
        terminalLogs={terminalLogs}
        onRetry={handleTriggerSnapshot}
        onDownloadAgain={handleDownloadAgain}
        downloadFileName={downloadFileName}
      />
    </div>
  );
}
