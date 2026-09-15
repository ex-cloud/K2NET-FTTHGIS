import { Button } from "@k2net/ui";
import {
  CheckCircle2,
  Loader2,
  Circle,
  AlertTriangle,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BACKUP_PIPELINE_STAGES } from "./BackupProgressModal";

interface BackupRunningPhaseProps {
  progress: number;
  currentStage: number;
  status: "RUNNING" | "FAILED";
  error: string | null;
  terminalLogs: string[];
  onClose: () => void;
  onRetry: () => void;
}

export function BackupRunningPhase({
  progress,
  currentStage,
  status,
  error,
  terminalLogs,
  onClose,
  onRetry,
}: BackupRunningPhaseProps) {
  const isRunning = status === "RUNNING";
  const isFailed = status === "FAILED";

  return (
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
  );
}
