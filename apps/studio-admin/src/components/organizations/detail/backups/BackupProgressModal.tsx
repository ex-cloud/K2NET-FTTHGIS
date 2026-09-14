import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Badge,
} from "@k2net/ui";
import {
  Database,
  CheckCircle2,
  Loader2,
  Circle,
  AlertTriangle,
  Download,
  Terminal,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    detail: "Mendaftarkan katalog riwayat backup dan menyiapkan berkas unduhan...",
  },
];

interface BackupProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgName: string;
  orgSlug: string;
  progress: number;
  currentStage: number;
  status: "IDLE" | "RUNNING" | "COMPLETED" | "FAILED";
  error: string | null;
  terminalLogs: string[];
  onRetry: () => void;
  onDownloadAgain?: () => void;
  downloadFileName?: string;
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
  onRetry,
  onDownloadAgain,
  downloadFileName,
}: BackupProgressModalProps) {
  const isCompleted = status === "COMPLETED";
  const isFailed = status === "FAILED";
  const isRunning = status === "RUNNING";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isRunning && !open && onClose()}>
      <DialogContent
        className="max-w-xl bg-card/95 border-border shadow-2xl backdrop-blur-xl p-6 rounded-2xl"
        showCloseButton={!isRunning}
      >
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
                  <span>Pipeline Pencadangan Data Tenant</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-[9px] px-1.5 py-0",
                      isCompleted && "border-primary/40 bg-primary/10 text-primary",
                      isRunning && "border-primary/40 bg-primary/10 text-primary animate-pulse",
                      isFailed && "border-destructive/40 bg-destructive/10 text-destructive"
                    )}
                  >
                    {isCompleted ? "COMPLETED" : isFailed ? "FAILED" : "LIVE PIPELINE"}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Snapshot database PostGIS, topologi spasial, dan metadata untuk <strong className="text-foreground">{orgName}</strong> ({orgSlug})
                </DialogDescription>
              </div>
            </div>
            <span className="font-mono text-sm font-bold text-primary">{Math.round(progress)}%</span>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Progress Bar Track */}
          <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden border border-border">
            <div
              className={cn(
                "h-full transition-all duration-500 ease-out",
                isFailed ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Pipeline Stage List */}
          <div className="space-y-1.5">
            {BACKUP_PIPELINE_STAGES.map((stage) => {
              const stageDone = isCompleted || stage.id < currentStage;
              const stageActive = isRunning && stage.id === currentStage;
              const stagePending = !isCompleted && stage.id > currentStage;

              return (
                <div
                  key={stage.id}
                  className={cn(
                    "flex items-start gap-3 p-2.5 rounded-xl border transition-all duration-300 text-xs",
                    stageActive && "border-primary/40 bg-primary/5 shadow-2xs",
                    stageDone && "border-border/60 bg-muted/20",
                    stagePending && "border-transparent opacity-40"
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {stageDone && <CheckCircle2 className="size-4 text-primary" />}
                    {stageActive && <Loader2 className="size-4 animate-spin text-primary" />}
                    {stagePending && <Circle className="size-4 text-muted-foreground" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={cn(
                          "font-semibold leading-tight",
                          stageActive
                            ? "text-foreground font-bold"
                            : stageDone
                            ? "text-foreground/85"
                            : "text-muted-foreground"
                        )}
                      >
                        {stage.label}
                      </p>
                      {stageDone && (
                        <span className="text-[10px] text-primary font-mono font-medium">Selesai</span>
                      )}
                      {stageActive && (
                        <span className="text-[10px] text-primary font-mono font-medium animate-pulse">
                          Memproses...
                        </span>
                      )}
                    </div>
                    {(stageActive || stageDone) && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{stage.detail}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Terminal Console Logs */}
          <div className="rounded-xl bg-muted/30 border border-border/80 overflow-hidden font-mono text-[10px]">
            <div className="bg-muted/60 px-3 py-1.5 border-b border-border flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Terminal className="size-3 text-primary" />
                <span>Execution Logs</span>
              </span>
              <span className="text-[9px] text-muted-foreground">AES-256 GCM</span>
            </div>
            <div className="p-2.5 space-y-1 max-h-28 overflow-y-auto">
              {terminalLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "leading-relaxed",
                    log.includes("[ERROR]")
                      ? "text-destructive"
                      : log.includes("[OK]") || log.includes("[FINISH]")
                      ? "text-primary font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Error Banner if Failed */}
          {isFailed && error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Pencadangan Gagal</p>
                <p className="text-[11px] opacity-90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Security & Info Footer */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/60">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-primary" />
              Enkripsi Snapshot Terisolasi per Tenant
            </span>
            {downloadFileName && isCompleted && (
              <span className="font-mono text-primary truncate max-w-xs">{downloadFileName}</span>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            {isFailed && (
              <>
                <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
                  Tutup
                </Button>
                <Button size="sm" onClick={onRetry} className="bg-primary text-primary-foreground cursor-pointer">
                  Coba Lagi
                </Button>
              </>
            )}

            {isRunning && (
              <Button size="sm" disabled className="bg-muted text-muted-foreground cursor-not-allowed gap-2">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Memproses Snapshot...</span>
              </Button>
            )}

            {isCompleted && (
              <>
                {onDownloadAgain && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDownloadAgain}
                    className="cursor-pointer gap-1.5"
                  >
                    <Download className="size-3.5" />
                    <span>Unduh Ulang JSON</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={onClose}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                >
                  Selesai
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
