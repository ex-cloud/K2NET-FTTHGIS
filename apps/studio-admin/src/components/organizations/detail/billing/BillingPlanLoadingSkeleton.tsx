import * as React from "react";

export function BillingPlanLoadingSkeleton() {
  return (
    <div className="space-y-4 pt-1">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="rounded-xl border border-border bg-card/40 p-5 space-y-4 animate-pulse h-[360px] flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-3.5 w-20 bg-muted rounded" />
              <div className="h-5 w-28 bg-muted rounded my-2" />
              <div className="h-8 w-full bg-muted/80 rounded" />
              <div className="space-y-2 pt-3">
                <div className="h-2.5 w-full bg-muted/50 rounded" />
                <div className="h-2.5 w-4/5 bg-muted/50 rounded" />
                <div className="h-2.5 w-3/4 bg-muted/50 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="h-28 rounded-xl border border-border bg-card/40 animate-pulse" />
    </div>
  );
}
