import { useCallback } from "react";
import { useSession } from "@/lib/auth-compat";
import type { EnrichedOrganization } from "../../types";
import { useSnapshotList } from "./useSnapshotList";
import { useBackupPipeline } from "./useBackupPipeline";
import { useSnapshotRestoreAndExport } from "./useSnapshotRestoreAndExport";

export function useOrgDataBackupsState(org: EnrichedOrganization) {
  const { data: session } = useSession();
  const orgIdentifier = org.slug || org.id;

  const authHeaders = useCallback((extra: Record<string, string> = {}) => {
    const headers: Record<string, string> = { ...extra };
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }
    return headers;
  }, [session?.accessToken]);

  const { snapshots, loadingSnapshots, fetchSnapshots } = useSnapshotList(orgIdentifier, authHeaders);

  const {
    triggering,
    isBackupModalOpen,
    backupProgress,
    backupStage,
    backupStatus,
    backupError,
    terminalLogs,
    downloadFileName,
    fileSizeBytes,
    sha256Fingerprint,
    handleOpenTriggerModal,
    handleStartBackupExecution,
    handleDownloadFile,
    closeBackupModal,
  } = useBackupPipeline(org, orgIdentifier, authHeaders, fetchSnapshots);

  const {
    restoring,
    handleDownloadSnapshot,
    handleSpatialExport,
    handleRestoreSnapshot,
  } = useSnapshotRestoreAndExport(org, orgIdentifier, authHeaders);

  return {
    triggering,
    restoring,
    loadingSnapshots,
    snapshots,
    fetchSnapshots,
    handleOpenTriggerModal,
    handleStartBackupExecution,
    handleDownloadFile,
    handleDownloadSnapshot,
    handleSpatialExport,
    handleRestoreSnapshot,
    // Backup Pipeline Modal
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
  };
}
