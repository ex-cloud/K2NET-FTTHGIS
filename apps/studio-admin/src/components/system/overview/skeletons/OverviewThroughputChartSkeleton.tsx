import { Card } from "@k2net/ui";
import { cn } from "@/lib/utils";

interface OverviewThroughputChartSkeletonProps {
  className?: string;
}

export function OverviewThroughputChartSkeleton({ className }: OverviewThroughputChartSkeletonProps) {
  return (
    <Card className={cn("border-border bg-card p-5 md:p-6 flex flex-col justify-between h-[360px]", className)}>
      {/* Header toolbar skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-groove-b pb-4">
        <div className="space-y-1.5">
          <div className="h-4 w-48 rounded bg-muted/60 animate-pulse" />
          <div className="h-3 w-64 rounded bg-muted/40 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-28 rounded-md bg-muted/50 animate-pulse" />
          <div className="h-7 w-16 rounded-md bg-muted/40 animate-pulse" />
        </div>
      </div>

      {/* Chart Bars Skeleton Grid */}
      <div className="py-6 flex items-end justify-between gap-1.5 h-[180px]">
        {[35, 55, 80, 45, 20, 30, 65, 90, 75, 50, 40, 60, 85, 95, 70, 40, 55, 75, 85, 60, 45, 30, 50, 70].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-muted/40 animate-pulse"
              style={{ height: `${h}%` }}
            />
            {i % 4 === 0 && <div className="h-2 w-4 rounded bg-muted/30 animate-pulse" />}
          </div>
        ))}
      </div>

      {/* Footer KPI metrics skeleton */}
      <div className="pt-4 border-groove-t flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <div className="space-y-1">
            <div className="h-2.5 w-16 rounded bg-muted/40 animate-pulse" />
            <div className="h-4 w-12 rounded bg-muted/60 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="h-2.5 w-16 rounded bg-muted/40 animate-pulse" />
            <div className="h-4 w-14 rounded bg-muted/60 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="h-2.5 w-16 rounded bg-muted/40 animate-pulse" />
            <div className="h-4 w-12 rounded bg-muted/60 animate-pulse" />
          </div>
        </div>
        <div className="h-7 w-28 rounded-md bg-muted/50 animate-pulse" />
      </div>
    </Card>
  );
}
