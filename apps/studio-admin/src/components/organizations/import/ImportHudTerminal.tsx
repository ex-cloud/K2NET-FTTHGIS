import * as React from "react";
import { Badge, Button } from "@k2net/ui";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProcessStatus } from "./types";

interface ImportHudTerminalProps {
  processStatus: ProcessStatus;
  currentActionText: string;
  processProgress: number;
  terminalLogs: string[];
  onClose: () => void;
  onReset: () => void;
}

export function ImportHudTerminal({
  processStatus,
  currentActionText,
  processProgress,
  terminalLogs,
  onClose,
  onReset,
}: ImportHudTerminalProps) {
  return (
    <div className="p-6 md:p-8 space-y-6 bg-card/80 text-foreground flex flex-col justify-between">
      {/* Header with HUD Diamond & Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded border border-border flex items-center justify-center bg-muted/40">
            <div className="h-3 w-3 rotate-45 border border-primary bg-primary/20" />
          </div>
          <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
            SYSTEM_RESTORE_INITIATED
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "font-mono text-[10px] tracking-widest uppercase px-2.5 py-0.5",
            processStatus === "ACTIVE" && "bg-primary/10 text-primary border-primary/30 animate-pulse",
            processStatus === "COMPLETED" && "bg-primary/20 text-primary border-primary/50",
            processStatus === "FAILED" && "bg-destructive/20 text-destructive border-destructive/50"
          )}
        >
          {processStatus}
        </Badge>
      </div>

      {/* Current Action & Progress Bar */}
      <div className="space-y-2 font-mono">
        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground/90 truncate">{currentActionText}</span>
          <span className="font-bold text-primary shrink-0 ml-2">{processProgress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              processStatus === "FAILED" ? "bg-destructive" : "bg-primary"
            )}
            style={{ width: `${processProgress}%` }}
          />
        </div>
      </div>

      {/* Terminal Log Console */}
      <div className="p-4 rounded-xl bg-background/90 border border-border/80 font-mono text-[11px] space-y-1.5 min-h-[140px] max-h-[180px] overflow-y-auto custom-scrollbar">
        {terminalLogs.map((log, idx) => (
          <div
            key={idx}
            className={cn(
              "leading-relaxed",
              log.includes("[ERROR]")
                ? "text-destructive"
                : log.includes("[OK]") || log.includes("[FINISH]")
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {log}
          </div>
        ))}
        {processStatus === "ACTIVE" && (
          <div className="text-primary animate-pulse flex items-center gap-1">
            <span>&gt; stream...</span>
          </div>
        )}
      </div>

      {/* Bottom HUD Actions */}
      <div className="pt-2 flex justify-end">
        {processStatus === "ACTIVE" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="font-mono text-xs border-border bg-background hover:bg-muted text-muted-foreground uppercase tracking-wider"
          >
            HIDE_PROCESS
          </Button>
        ) : (
          <Button
            variant={processStatus === "COMPLETED" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              onReset();
              onClose();
            }}
            className="font-mono text-xs uppercase tracking-wider gap-1.5"
          >
            {processStatus === "COMPLETED" ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                SELESAI & TUTUP
              </>
            ) : (
              "TUTUP"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
