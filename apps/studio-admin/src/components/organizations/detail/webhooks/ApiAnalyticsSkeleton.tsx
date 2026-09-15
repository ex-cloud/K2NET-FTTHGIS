import { cn } from "@/lib/utils";

interface ApiAnalyticsSkeletonProps {
  className?: string;
}

export function ApiAnalyticsSkeleton({ className }: ApiAnalyticsSkeletonProps) {
  return (
    <div className={cn("space-y-5 animate-pulse", className)}>
      {/* 4 KPI Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-2"
          >
            <div className="h-2.5 w-20 bg-muted/70 rounded" />
            <div className="h-6 w-24 bg-muted/90 rounded my-1" />
            <div className="h-2.5 w-28 bg-muted/50 rounded" />
          </div>
        ))}
      </div>

      {/* Timeseries & Breakdown Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {/* 7-Day Chart Box */}
        <div className="md:col-span-2 p-4 rounded-xl border border-border/80 bg-background/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3 w-48 bg-muted/70 rounded" />
            <div className="h-2.5 w-16 bg-muted/50 rounded" />
          </div>

          <div className="h-32 flex items-end justify-between gap-2 pt-4 px-1">
            {[45, 75, 30, 90, 60, 85, 65].map((height, idx) => (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
              >
                <div
                  style={{ height: `${height}%` }}
                  className="w-full max-w-[28px] rounded-t bg-muted/70 transition-all"
                />
                <div className="h-2 w-7 bg-muted/50 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Status HTTP Breakdown Box */}
        <div className="p-4 rounded-xl border border-border/80 bg-background/40 space-y-3">
          <div className="h-3 w-32 bg-muted/70 rounded" />

          {/* Stacked Bar */}
          <div className="h-4 w-full rounded-full bg-muted/60 overflow-hidden" />

          {/* Legend Items */}
          <div className="space-y-2.5 pt-1">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-muted" />
                  <div className="h-2.5 w-28 bg-muted/60 rounded" />
                </div>
                <div className="h-2.5 w-14 bg-muted/70 rounded" />
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border/50">
            <div className="h-2.5 w-44 bg-muted/40 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
