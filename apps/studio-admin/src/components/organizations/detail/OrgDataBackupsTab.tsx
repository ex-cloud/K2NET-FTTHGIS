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
    handleOpenTriggerModal,
    handleStartBackupExecution,
    handleDownloadFile,
    handleDownloadSnapshot,
    handleSpatialExport,
    handleRestoreSnapshot,
    isBackupModalOpen,
    backupProgress,
    backupStage,
    backupStatus,
    backupError,
    terminalLogs,
    downloadFileName,
    fileSizeBytes,
    sha256Fingerprint,
    closeBackupModal,
  } = useOrgDataBackupsState(org);

  return (
    <div className="space-y-6">
      {/* 1. Master Backup & Data Sovereignty Banner */}
      <BackupsHeaderBar
        onOpenImportModal={onOpenImportModal}
        onTriggerSnapshot={handleOpenTriggerModal}
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
        onDownloadSnapshot={handleDownloadSnapshot}
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
        onStartExecution={handleStartBackupExecution}
        onRetry={() => handleStartBackupExecution()}
        onDownloadFile={handleDownloadFile}
        downloadFileName={downloadFileName}
        fileSizeBytes={fileSizeBytes}
        sha256Fingerprint={sha256Fingerprint}
      />
    </div>
  );
}
