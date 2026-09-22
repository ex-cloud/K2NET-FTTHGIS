export function OverviewRecentHubSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header + Tabs row skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-groove-b pb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-muted/60 animate-pulse" />
          <div className="space-y-1">
            <div className="h-4 w-44 rounded bg-muted/60 animate-pulse" />
            <div className="h-3 w-64 rounded bg-muted/40 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-20 rounded-md bg-muted/40 animate-pulse" />
          <div className="h-7 w-32 rounded-md bg-muted/50 animate-pulse" />
        </div>
      </div>

      {/* Tabs navigation pill buttons skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-32 rounded-lg bg-muted/40 shrink-0 animate-pulse" />
        ))}
      </div>

      {/* Table rows skeleton */}
      <div className="overflow-hidden rounded-xl border border-border bg-card/60">
        <div className="p-3 border-b border-border/60 bg-muted/30 flex items-center justify-between">
          <div className="h-3 w-28 rounded bg-muted/50 animate-pulse" />
          <div className="h-3 w-20 rounded bg-muted/40 animate-pulse" />
        </div>
        <div className="divide-y divide-border/40">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-6 rounded-md bg-muted/40 animate-pulse" />
                <div className="space-y-1">
                  <div className="h-3.5 w-36 rounded bg-muted/60 animate-pulse" />
                  <div className="h-2.5 w-48 rounded bg-muted/30 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-20 rounded-md bg-muted/40 animate-pulse" />
                <div className="h-5 w-16 rounded-md bg-muted/50 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
