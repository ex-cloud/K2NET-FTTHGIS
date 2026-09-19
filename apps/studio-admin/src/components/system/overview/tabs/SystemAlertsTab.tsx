import { AlertCircle, AlertTriangle, CheckCircle2, ArrowUpRight } from "lucide-react";
import { Link } from "@/lib/navigation-compat";
import { Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { SystemAlertItem } from "../recent-operations-types";

interface SystemAlertsTabProps {
  items: SystemAlertItem[];
  loading: boolean;
}

export function SystemAlertsTab({ items, loading }: SystemAlertsTabProps) {
  if (loading) {
    return (
      <div className="space-y-2.5">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card/20" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/40 p-8 text-center text-xs text-muted-foreground space-y-1.5">
        <div className="flex justify-center">
          <div className="p-2 rounded-full bg-primary/10 border border-primary/20 text-primary">
            <CheckCircle2 className="size-6" />
          </div>
        </div>
        <h4 className="text-sm font-semibold text-foreground">Semua Layanan Beroperasi Normal</h4>
        <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
          Tidak ada insiden aktif atau anomali telemetri yang terdeteksi pada microservices, database, maupun gateway API.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((alert) => {
        const isCritical = alert.severity === "critical";

        return (
          <div
            key={alert.id}
            className={cn(
              "flex flex-col justify-between gap-3 rounded-xl border p-4 transition-all duration-200 sm:flex-row sm:items-center",
              isCritical
                ? "border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10"
                : "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
            )}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 mt-0.5",
                  isCritical
                    ? "border-rose-500/30 bg-rose-500/15 text-rose-400"
                    : "border-amber-500/30 bg-amber-500/15 text-amber-400"
                )}
              >
                {isCritical ? <AlertCircle className="size-4" /> : <AlertTriangle className="size-4" />}
              </div>

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-foreground truncate">
                    {alert.title}
                  </h4>
                  <span
                    className={cn(
                      "inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold uppercase border",
                      isCritical
                        ? "bg-rose-500/15 text-rose-400 border-rose-500/25"
                        : "bg-amber-500/15 text-amber-400 border-amber-500/25"
                    )}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{alert.message}</p>
                <p className="text-[10px] font-mono text-muted-foreground/70">
                  Affected Service: <span className="font-semibold text-foreground/80">{alert.service}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end shrink-0 pl-11 sm:pl-0">
              <span className="text-[10px] font-mono text-muted-foreground">
                {alert.triggerTime}
              </span>
              <Button
                variant="outline"
                size="sm"
                asChild
                className={cn(
                  "h-8 px-3 text-xs gap-1 cursor-pointer",
                  isCritical
                    ? "border-rose-500/40 text-rose-400 hover:bg-rose-500/20"
                    : "border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
                )}
              >
                <Link href={alert.actionUrl || "/observability/overview"}>
                  <span>{alert.actionLabel || "Investigate"}</span>
                  <ArrowUpRight className="size-3" />
                </Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
