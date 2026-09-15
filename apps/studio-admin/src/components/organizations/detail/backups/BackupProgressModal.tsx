import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
} from "@k2net/ui";
import {
  Database,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BackupConfigPhase } from "./BackupConfigPhase";
import { BackupRunningPhase } from "./BackupRunningPhase";
import { BackupCompletedPhase } from "./BackupCompletedPhase";

export interface BackupStageInfo {
  id: number;
  label: string;
  detail: string;
}

export const BACKUP_PIPELINE_STAGES: BackupStageInfo[] = [
  {
    id: 1,
    label: "Validasi Akses & Sesi Tenant",
    detail: "Memvalidasi token otorisasi dan identitas organisasi...",
  },
  {
    id: 2,
    label: "Ekstraksi Entitas Topologi PostGIS",
    detail: "Mengambil data spasial, titik simpul ODC/ODP, dan jalur fiber optik...",
  },
  {
    id: 3,
    label: "Pengemasan Metadata & Skema Proyek",
    detail: "Mengompilasi profil tenant, Keycloak realm, dan struktur proyek...",
  },
  {
    id: 4,
    label: "Enkripsi Checksum & Pembuatan Arsip JSON",
    detail: "Menghitung SHA-256 dan memvalidasi keutuhan payload snapshot...",
  },
  {
    id: 5,
    label: "Finalisasi & Penyimpanan Snapshot",
    detail: "Mendaftarkan katalog riwayat backup dan menyiapkan berkas arsip...",
  },
];

interface BackupProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgName: string;
  orgSlug: string;
  progress: number;
  currentStage: number;
  status: "IDLE" | "CONFIG" | "RUNNING" | "COMPLETED" | "FAILED";
  error: string | null;
  terminalLogs: string[];
  onStartExecution: (note?: string) => void;
  onRetry: () => void;
  onDownloadFile?: () => void;
  downloadFileName?: string;
  fileSizeBytes?: number;
  sha256Fingerprint?: string;
}

export function BackupProgressModal({
  isOpen,
  onClose,
  orgName,
  orgSlug,
  progress,
  currentStage,
  status,
  error,
  terminalLogs,
  onStartExecution,
  onRetry,
  onDownloadFile,
  downloadFileName,
  fileSizeBytes = 0,
  sha256Fingerprint = "",
}: BackupProgressModalProps) {
  const isConfig = status === "IDLE" || status === "CONFIG";
  const isRunning = status === "RUNNING";
  const isCompleted = status === "COMPLETED";
  const isFailed = status === "FAILED";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isRunning && !open && onClose()}>
      <DialogContent
        className="max-w-xl bg-card/95 border-border shadow-2xl backdrop-blur-xl p-6 rounded-2xl"
        showCloseButton={!isRunning}
      >
        {/* Header */}
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "size-9 rounded-xl flex items-center justify-center border shadow-xs transition-colors",
                  isCompleted
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : isFailed
                    ? "bg-destructive/10 border-destructive/30 text-destructive"
                    : "bg-primary/10 border-primary/20 text-primary"
                )}
              >
                {isRunning ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : isCompleted ? (
                  <CheckCircle2 className="size-5" />
                ) : isFailed ? (
                  <AlertTriangle className="size-5" />
                ) : (
                  <Database className="size-5" />
                )}
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>
                    {isConfig
                      ? "Pencadangan Penuh Data Tenant"
                      : isCompleted
                      ? "Snapshot Berhasil Dibuat"
                      : "Pipeline Pencadangan Data Tenant"}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-[9px] px-1.5 py-0",
                      isCompleted && "border-primary/40 bg-primary/10 text-primary",
                      isRunning && "border-primary/40 bg-primary/10 text-primary animate-pulse",
                      isFailed && "border-destructive/40 bg-destructive/10 text-destructive",
                      isConfig && "border-border text-muted-foreground"
                    )}
                  >
                    {isCompleted ? "COMPLETED" : isFailed ? "FAILED" : isRunning ? "LIVE PIPELINE" : "PRE-FLIGHT"}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Snapshot database PostGIS, topologi spasial, dan metadata untuk{" "}
                  <strong className="text-foreground">{orgName}</strong> ({orgSlug})
                </DialogDescription>
              </div>
            </div>
            {!isConfig && (
              <span className="font-mono text-sm font-bold text-primary">{Math.round(progress)}%</span>
            )}
          </div>
        </DialogHeader>

        {/* Phase 1: Pre-flight Config */}
        {isConfig && (
          <BackupConfigPhase
            isOpen={isOpen}
            onClose={onClose}
            onStartExecution={onStartExecution}
          />
        )}

        {/* Phase 2: Running / Failed */}
        {(isRunning || isFailed) && (
          <BackupRunningPhase
            progress={progress}
            currentStage={currentStage}
            status={status}
            error={error}
            terminalLogs={terminalLogs}
            onClose={onClose}
            onRetry={onRetry}
          />
        )}

        {/* Phase 3: Completed */}
        {isCompleted && (
          <BackupCompletedPhase
            downloadFileName={downloadFileName}
            fileSizeBytes={fileSizeBytes}
            sha256Fingerprint={sha256Fingerprint}
            onDownloadFile={onDownloadFile}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
