import { Cpu, CheckCircle2, Clock, AlertCircle, ArrowUpRight } from "lucide-react";
import { Link } from "@/lib/navigation-compat";
import { Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { BackgroundJobItem } from "../recent-operations-types";

interface BackgroundJobsTabProps {
  items: BackgroundJobItem[];
  loading: boolean;
}

export function BackgroundJobsTab({ items, loading }: BackgroundJobsTabProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-card/20" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/40 p-8 text-center text-xs text-muted-foreground">
        Tidak ada antrean background jobs yang sedang berjalan saat ini.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((job) => {
        const isRunning = job.status === "RUNNING";
        const isFailed = job.status === "FAILED";

        return (
          <div
            key={job.id}
            className="flex flex-col justify-between rounded-xl border border-border bg-card/60 p-3.5 transition-all duration-200 hover:bg-card/95 space-y-3"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Cpu className="size-3.5 text-primary shrink-0" />
                  <h4 className="text-xs font-semibold text-foreground truncate" title={job.jobType}>
                    {job.jobType}
                  </h4>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium border shrink-0",
                    isRunning
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/25 animate-pulse"
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
                  {job.status}
                </span>
              </div>

              <p className="text-[10px] text-muted-foreground truncate">
                Target: <span className="font-medium text-foreground/80">{job.targetOrg}</span>
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-foreground font-medium">{job.progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  style={{ width: `${job.progressPercent}%` }}
                  className={cn(
                    "h-full transition-all duration-300",
                    isRunning ? "bg-amber-400" : isFailed ? "bg-rose-500" : "bg-primary"
                  )}
                />
              </div>
            </div>

            {/* Footer Duration & Detail Link */}
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/40">
              <span>Duration: {job.duration}</span>
              <Button
                variant="link"
                size="sm"
                asChild
                className="h-auto p-0 text-[10px] font-mono text-primary hover:text-primary/80 gap-0.5"
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
