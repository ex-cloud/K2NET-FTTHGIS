import { CheckCircle2, Loader2, Circle, Layers } from "lucide-react";
import { Badge } from "@k2net/ui";
import { cn } from "@/lib/utils";
import { PROVISIONING_STAGES, type ProvisioningStageInfo } from "./types";

interface Step4ProvisioningProgressProps {
  provisioningStage?: number;
  provisioningStages?: ProvisioningStageInfo[];
}

export function Step4ProvisioningProgress({
  provisioningStage = 1,
  provisioningStages = PROVISIONING_STAGES,
}: Step4ProvisioningProgressProps) {
  const progressPercent = Math.min(100, Math.max(15, (provisioningStage / 5) * 100));

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="rounded-xl border border-primary/30 bg-card/90 p-5 space-y-4 shadow-lg backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Loader2 className="size-4 animate-spin" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <span>Menerapkan Organisasi & Infrastruktur</span>
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[9px]">
                  LIVE
                </Badge>
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Menyiapkan database terisolasi, realm Keycloak 26, dan akun PIC...
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-primary">{Math.round(progressPercent)}%</span>
        </div>

        {/* Progress Track */}
        <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden border border-border">
          <div
            className="bg-primary h-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stage List */}
        <div className="space-y-2 pt-1">
          {provisioningStages.map((stage) => {
            const isCompleted = stage.id < provisioningStage;
            const isCurrent = stage.id === provisioningStage;
            const isPending = stage.id > provisioningStage;

            return (
              <div
                key={stage.id}
                className={cn(
                  "flex items-start gap-3 p-2.5 rounded-lg border transition-all duration-300",
                  isCurrent && "border-primary/40 bg-primary/5 shadow-xs",
                  isCompleted && "border-border/60 bg-muted/20",
                  isPending && "border-transparent opacity-40"
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted && <CheckCircle2 className="size-4 text-primary" />}
                  {isCurrent && <Loader2 className="size-4 animate-spin text-primary" />}
                  {isPending && <Circle className="size-4 text-muted-foreground" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        "text-xs font-semibold leading-tight",
                        isCurrent ? "text-foreground font-bold" : isCompleted ? "text-foreground/85" : "text-muted-foreground"
                      )}
                    >
                      {stage.label}
                    </p>
                    {isCompleted && (
                      <span className="text-[10px] text-primary font-mono font-medium">Selesai</span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] text-primary font-mono font-medium animate-pulse">Memproses...</span>
                    )}
                  </div>
                  {(isCurrent || isCompleted) && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{stage.detail}</p>
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
            Proses provisi keamanan Keycloak membutuhkan waktu sekitar <strong>15 detik</strong>. Mohon tidak menutup jendela ini.
          </span>
        </div>
      </div>
    </div>
  );
}
