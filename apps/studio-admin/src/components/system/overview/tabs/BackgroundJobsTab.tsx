import { CheckCircle2, Clock, AlertCircle, ArrowUpRight, Database, RefreshCw, Shield } from "lucide-react";
import { Link } from "@/lib/navigation-compat";
import { Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { BackgroundJobItem } from "../recent-operations-types";

interface BackgroundJobsTabProps {
  items: BackgroundJobItem[];
  loading: boolean;
}

function getJobIcon(jobType: string) {
  const t = (jobType ?? "").toLowerCase();
  if (t.includes("martin") || t.includes("tile") || t.includes("mvt"))
    return { emoji: "🔄", Icon: RefreshCw };
  if (t.includes("postgis") || t.includes("spatial") || t.includes("topology"))
    return { emoji: "🗄️", Icon: Database };
  if (t.includes("geojson") || t.includes("odp") || t.includes("import"))
    return { emoji: "📦", Icon: Database };
  if (t.includes("keycloak") || t.includes("iam") || t.includes("realm"))
    return { emoji: "🔐", Icon: Shield };
  if (t.includes("backup") || t.includes("snapshot") || t.includes("db"))
    return { emoji: "💾", Icon: Database };
  return { emoji: "⚙️", Icon: Clock };
}

export function BackgroundJobsTab({ items, loading }: BackgroundJobsTabProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-card/20" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/30 p-8 text-center space-y-2">
        <CheckCircle2 className="mx-auto size-8 text-primary opacity-60" />
        <p className="text-sm font-semibold text-foreground">Tidak Ada Background Jobs Aktif</p>
        <p className="text-[11px] text-muted-foreground">
          Antrean GIS provisioning, impor ODP, dan migrasi skema PostGIS dalam kondisi idle.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((job) => {
        const isRunning = job.status === "RUNNING";
        const isFailed = job.status === "FAILED";
        const { emoji, Icon } = getJobIcon(job.jobType);

        return (
          <div
            key={job.id}
            className={cn(
              "flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-200 space-y-3",
              isRunning
                ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/8 hover:border-amber-500/40"
                : isFailed
                ? "border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/8"
                : "border-border bg-card/60 hover:bg-card/95 hover:border-primary/30"
            )}
          >
            {/* Header: Job icon, title, and status badge */}
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm shrink-0" aria-hidden>
                    {emoji}
                  </span>
                  <h4
                    className="text-xs font-semibold text-foreground truncate"
                    title={job.jobType}
                  >
                    {job.jobType}
                  </h4>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-mono font-medium shrink-0",
                    isRunning
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse"
                      : isFailed
                      ? "bg-rose-500/15 text-rose-400 border-rose-500/25"
                      : "bg-primary/15 text-primary border-primary/25"
                  )}
                >
                  {isRunning ? (
                    <Clock className="size-2.5 animate-spin" />
                  ) : isFailed ? (
                    <AlertCircle className="size-2.5" />
                  ) : (
                    <CheckCircle2 className="size-2.5" />
                  )}
                  {isRunning ? "RUNNING" : isFailed ? "FAILED" : "COMPLETED"}
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground truncate">
                <span className="text-foreground/60">Target: </span>
                <span className="font-medium text-foreground/85">{job.targetOrg}</span>
              </p>
            </div>

            {/* Progress bar (RUNNING) or completion summary */}
            {isRunning ? (
              <div className="space-y-1.5 bg-amber-500/8 rounded-lg border border-amber-500/20 p-2">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-amber-400/80">Progress</span>
                  <span className="text-amber-400 font-bold">{job.progressPercent}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-amber-500/20">
                  <div
                    style={{ width: `${job.progressPercent}%` }}
                    className="h-full rounded-full bg-amber-400 transition-all duration-500 relative overflow-hidden"
                  >
                    {/* Shimmer animation on progress bar */}
                    <span className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                </div>
                <p className="text-[10px] font-mono text-amber-400/70">
                  Started: {job.startedAt}
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg border text-[10px] font-mono",
                  isFailed
                    ? "bg-rose-500/10 border-rose-500/20"
                    : "bg-muted/30 border-border/50"
                )}
              >
                <span className="text-muted-foreground">Execution</span>
                <span
                  className={cn(
                    "font-semibold",
                    isFailed ? "text-rose-400" : "text-primary"
                  )}
                >
                  {isFailed
                    ? "❌ Error encountered"
                    : `✅ COMPLETED in ${job.duration || "—"}`}
                </span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/40">
              <span className="truncate flex items-center gap-1">
                <Icon className="size-2.5 opacity-50" />
                <span>{isRunning ? "Started" : "Finished"}: {job.startedAt}</span>
              </span>
              <Button
                variant="link"
                size="sm"
                asChild
                className="h-auto p-0 text-[10px] font-mono text-primary hover:text-primary/80 gap-0.5 shrink-0"
              >
                <Link href="/observability/scheduler">
                  <span>Queue Details</span>
                  <ArrowUpRight className="size-2.5" />
                </Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
