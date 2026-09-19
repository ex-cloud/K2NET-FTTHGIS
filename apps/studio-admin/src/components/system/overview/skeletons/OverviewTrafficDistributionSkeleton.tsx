import { Card } from "@k2net/ui";
import { cn } from "@/lib/utils";

interface OverviewTrafficDistributionSkeletonProps {
  className?: string;
}

export function OverviewTrafficDistributionSkeleton({ className }: OverviewTrafficDistributionSkeletonProps) {
  return (
    <Card className={cn("border-border bg-card p-5 md:p-6 flex flex-col justify-between h-[360px]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-muted/50 animate-pulse" />
          <div className="space-y-1">
            <div className="h-3.5 w-32 rounded bg-muted/60 animate-pulse" />
            <div className="h-2.5 w-44 rounded bg-muted/40 animate-pulse" />
          </div>
        </div>
        <div className="h-4 w-16 rounded-full bg-muted/40 animate-pulse" />
      </div>

      {/* Donut Chart Skeleton */}
      <div className="flex items-center justify-center py-4">
        <div className="size-32 rounded-full border-8 border-muted/40 animate-pulse flex items-center justify-center">
          <div className="space-y-1 text-center">
            <div className="h-5 w-14 mx-auto rounded bg-muted/60 animate-pulse" />
            <div className="h-2 w-16 mx-auto rounded bg-muted/30 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Breakdown list skeleton */}
      <div className="space-y-2 border-t border-border/50 pt-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-muted/50 animate-pulse" />
              <div className="h-3 w-28 rounded bg-muted/40 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-10 rounded bg-muted/50 animate-pulse" />
              <div className="h-3 w-8 rounded bg-muted/30 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
