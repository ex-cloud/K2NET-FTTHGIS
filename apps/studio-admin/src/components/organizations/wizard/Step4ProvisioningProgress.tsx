import { CheckCircle2, Loader2, Circle, Layers, AlertTriangle, RotateCcw } from "lucide-react";
import { Badge, Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
import { PROVISIONING_STAGES, type ProvisioningStageInfo } from "./types";

interface Step4ProvisioningProgressProps {
  provisioningStage?: number;
  provisioningStages?: ProvisioningStageInfo[];
  stageDurations?: Record<number, number>;
  stageDetails?: Record<number, string>;
  streamError?: string | null;
  onRetry?: () => void;
}

export function Step4ProvisioningProgress({
  provisioningStage = 1,
  provisioningStages = PROVISIONING_STAGES,
  stageDurations = {},
  stageDetails = {},
  streamError,
  onRetry,
}: Step4ProvisioningProgressProps) {
  const progressPercent = Math.min(100, Math.max(15, (provisioningStage / 5) * 100));

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className={cn(
        "rounded-xl border p-5 space-y-4 shadow-lg backdrop-blur-md transition-colors",
        streamError
          ? "border-destructive/40 bg-destructive/5"
          : "border-primary/30 bg-card/90"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "size-8 rounded-lg border flex items-center justify-center",
              streamError
                ? "bg-destructive/10 border-destructive/20 text-destructive"
                : "bg-primary/10 border-primary/20 text-primary"
            )}>
              {streamError ? (
                <AlertTriangle className="size-4" />
              ) : (
                <Loader2 className="size-4 animate-spin" />
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <span>Deploying Organization & Infrastructure</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono text-[9px]",
                    streamError
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-primary/40 bg-primary/10 text-primary animate-pulse"
                  )}
                >
                  {streamError ? "FAILED" : "LIVE SSE"}
                </Badge>
              </h4>
              <p className="text-[11px] text-muted-foreground">
                {streamError
                  ? "An error occurred during tenant deployment. You can retry provisioning."
                  : "Streaming real-time provisioning events from Spring Boot backend..."}
              </p>
            </div>
          </div>
          <span className={cn(
            "font-mono text-xs font-bold",
            streamError ? "text-destructive" : "text-primary"
          )}>
            {Math.round(progressPercent)}%
          </span>
        </div>

        {/* Progress Track */}
        <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden border border-border">
          <div
            className={cn(
              "h-full transition-all duration-700 ease-out",
              streamError ? "bg-destructive" : "bg-primary"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Error Callout if any */}
        {streamError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="size-4 shrink-0" />
              <span className="font-medium truncate">{streamError}</span>
            </div>
            {onRetry && (
              <Button
                size="sm"
                variant="destructive"
                className="h-7 px-2.5 text-xs font-medium shrink-0 flex items-center gap-1.5"
                onClick={onRetry}
              >
                <RotateCcw className="size-3.5" />
                <span>Retry</span>
              </Button>
            )}
          </div>
        )}

        {/* Stage List */}
        <div className="space-y-2 pt-1">
          {provisioningStages.map((stage) => {
            const isCompleted = stage.id < provisioningStage || (provisioningStage === 5 && !streamError);
            const isCurrent = stage.id === provisioningStage && !streamError;
            const isFailed = stage.id === provisioningStage && !!streamError;
            const isPending = stage.id > provisioningStage;
            const durationMs = stageDurations[stage.id];
            const liveDetail = stageDetails[stage.id] || stage.detail;

            return (
              <div
                key={stage.id}
                className={cn(
                  "flex items-start gap-3 p-2.5 rounded-lg border transition-all duration-300",
                  isCurrent && "border-primary/40 bg-primary/5 shadow-xs",
                  isCompleted && "border-border/60 bg-muted/20",
                  isFailed && "border-destructive/40 bg-destructive/10",
                  isPending && "border-transparent opacity-40"
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted && <CheckCircle2 className="size-4 text-primary" />}
                  {isCurrent && <Loader2 className="size-4 animate-spin text-primary" />}
                  {isFailed && <AlertTriangle className="size-4 text-destructive" />}
                  {isPending && <Circle className="size-4 text-muted-foreground" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-xs leading-tight truncate",
                        isCurrent ? "text-foreground font-bold" : isCompleted ? "text-foreground/85 font-semibold" : isFailed ? "text-destructive font-bold" : "text-muted-foreground"
                      )}
                    >
                      {stage.label}
                    </p>
                    {isCompleted && (
                      <span className="text-[10px] text-primary font-mono font-medium shrink-0">
                        {durationMs ? `Completed in ${(durationMs / 1000).toFixed(1)}s` : "Completed"}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] text-primary font-mono font-medium animate-pulse shrink-0">
                        Processing...
                      </span>
                    )}
                    {isFailed && (
                      <span className="text-[10px] text-destructive font-mono font-medium shrink-0">
                        Failed
                      </span>
                    )}
                  </div>
                  {(isCurrent || isCompleted || isFailed) && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{liveDetail}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Safe Lock Warning */}
        <div className="rounded-lg bg-muted/50 border border-border p-2.5 text-[10px] text-muted-foreground flex items-center gap-2">
          <Layers className="size-3.5 text-primary shrink-0" />
          <span>
            Keycloak security & isolated realm provisioning takes approximately <strong>10–15 seconds</strong>. Please keep this browser window open.
          </span>
        </div>
      </div>
    </div>
  );
}
