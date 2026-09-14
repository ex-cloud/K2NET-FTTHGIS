import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Badge,
  Input,
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
  MapPin,
  Lock,
  FileText,
  CreditCard,
  Cloud,
  HardDrive,
  Play,
  ArrowRight,
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
  const [backupNote, setBackupNote] = useState("");
  const isConfig = status === "IDLE" || status === "CONFIG";
  const isRunning = status === "RUNNING";
  const isCompleted = status === "COMPLETED";
  const isFailed = status === "FAILED";

  useEffect(() => {
    if (isOpen && isConfig) {
      setBackupNote("");
    }
  }, [isOpen, isConfig]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isRunning && !open && onClose()}>
      <DialogContent
        className="max-w-xl bg-card/95 border-border shadow-2xl backdrop-blur-xl p-6 rounded-2xl"
        showCloseButton={!isRunning}
      >
        {/* ─── Header ──────────────────────────────────────────────────────── */}
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

        {/* ─── Body: Phase 1 (Configuration & Pre-flight Confirmation) ──────── */}
        {isConfig && (
          <div className="space-y-4 pt-2">
            {/* Scope Breakdown */}
            <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="size-3.5 text-primary" />
                  Cakupan Komponen yang Akan Dicadangkan:
                </span>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono">
                  AES-256 ENCRYPTED
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border/60">
                  <MapPin className="size-3.5 text-purple-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Topologi PostGIS</p>
                    <p className="text-[10px] text-muted-foreground">Kabel fiber, ODC, ODP, &amp; boundary</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border/60">
                  <Lock className="size-3.5 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Keycloak 26 IAM</p>
                    <p className="text-[10px] text-muted-foreground">Realm, users, roles, &amp; permissions</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border/60">
                  <FileText className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Dokumen Vault</p>
                    <p className="text-[10px] text-muted-foreground">Metadata arsip PDF/KMZ tenant</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border/60">
                  <CreditCard className="size-3.5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Billing &amp; Kuota</p>
                    <p className="text-[10px] text-muted-foreground">Tier paket &amp; konfigurasi entitas</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Storage Redundancy Note */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card">
                <HardDrive className="size-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">Penyimpanan Utama</p>
                  <p className="font-mono text-xs font-semibold text-foreground truncate">MinIO S3 Bucket</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card">
                <Cloud className="size-4 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">Redundansi Cloud</p>
                  <p className="font-mono text-xs font-semibold text-foreground truncate">Nextcloud WebDAV</p>
                </div>
              </div>
            </div>

            {/* Optional Snapshot Label */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Catatan / Keterangan Snapshot (Opsional)</span>
                <span className="text-[10px] font-normal text-muted-foreground">Label identifikasi</span>
              </label>
              <Input
                value={backupNote}
                onChange={(e) => setBackupNote(e.target.value)}
                placeholder="Misal: Checkpoint migrasi jaringan, audit kepatuhan, dll."
                className="h-9 text-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
                Batal
              </Button>
              <Button
                size="sm"
                onClick={() => onStartExecution(backupNote)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer gap-1.5"
              >
                <Play className="size-3.5 fill-current" />
                <span>Mulai Proses Cadangkan</span>
              </Button>
            </div>
          </div>
        )}

        {/* ─── Body: Phase 2 (Live Pipeline Execution & Terminal Logs) ───────── */}
        {(isRunning || isFailed) && (
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
                const stageDone = stage.id < currentStage;
                const stageActive = isRunning && stage.id === currentStage;
                const stagePending = stage.id > currentStage;

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
              <div className="p-2.5 space-y-1 max-h-24 overflow-y-auto">
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

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
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
                  <span>Memproses Snapshot Pipeline...</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ─── Body: Phase 3 (Completed Summary with On-Demand Download) ───── */}
        {isCompleted && (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    Snapshot Berhasil Dibuat &amp; Terdaftar di Database!
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Data telah tersimpan di katalog riwayat dan siap digunakan untuk recovery kapan saja.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-3 font-mono text-xs space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Nama Berkas:</span>
                  <span className="font-bold text-foreground truncate max-w-xs">{downloadFileName}</span>
                </div>
                {fileSizeBytes > 0 && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Ukuran Berkas:</span>
                    <span className="text-foreground font-semibold">{(fileSizeBytes / 1024).toFixed(1)} KB</span>
                  </div>
                )}
                {sha256Fingerprint && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>SHA-256:</span>
                    <span className="text-primary truncate max-w-xs">{sha256Fingerprint.substring(0, 24)}...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-primary" />
                Tersedia di Tabel Riwayat
              </span>
              <div className="flex items-center gap-2">
                {onDownloadFile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDownloadFile}
                    className="cursor-pointer gap-1.5"
                  >
                    <Download className="size-3.5 text-primary" />
                    <span>Unduh Berkas (.json)</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={onClose}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer gap-1"
                >
                  <span>Selesai &amp; Lihat Riwayat</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
