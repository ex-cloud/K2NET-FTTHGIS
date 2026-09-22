import { cn } from "@/lib/utils";

export function OverviewMetricCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-3 xl:grid-cols-5">
      {/* 5 KPI Skeletons */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-xl border border-border bg-card/60 p-4 space-y-3",
            i === 1 ? "col-span-2 sm:col-span-1 xl:col-span-1" : "col-span-1"
          )}
        >
          {/* Header eyebrow + badge */}
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 rounded bg-muted/60 animate-pulse" />
            <div className="h-4 w-12 rounded-full bg-muted/40 animate-pulse" />
          </div>

          {/* Big number value */}
          <div className="space-y-1.5 pt-1">
            <div className="h-7 w-24 rounded-md bg-muted/70 animate-pulse" />
            <div className="h-3 w-32 rounded bg-muted/40 animate-pulse" />
          </div>

          {/* Footer link */}
          <div className="pt-2 border-groove-t flex items-center justify-between">
            <div className="h-2.5 w-16 rounded bg-muted/40 animate-pulse" />
            <div className="h-2.5 w-12 rounded bg-muted/50 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
