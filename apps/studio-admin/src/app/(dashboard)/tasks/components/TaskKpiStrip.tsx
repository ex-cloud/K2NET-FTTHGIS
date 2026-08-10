import React from "react";
import { ClipboardList, AlertCircle, CheckCircle2 } from "lucide-react";
import { useTaskSummary } from "@/hooks/useTaskSummary";
import { cn } from "@/lib/utils";

export function TaskKpiStrip() {
  const { summary, loading } = useTaskSummary();

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[
        {
          label: "Active Tasks",
          value: loading ? "—" : summary?.totalOpen ?? 0,
          icon: ClipboardList,
          accent: "text-primary",
        },
        {
          label: "Urgent",
          value: loading ? "—" : summary?.urgentCount ?? 0,
          icon: AlertCircle,
          accent: (summary?.urgentCount ?? 0) > 0 ? "text-destructive" : "text-muted-foreground",
          pulse: (summary?.urgentCount ?? 0) > 0,
        },
        {
          label: "Resolved Today",
          value: loading ? "—" : summary?.resolvedToday ?? 0,
          icon: CheckCircle2,
          accent: "text-green-500",
        },
      ].map((kpi) => (
        <div
          key={kpi.label}
          className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
        >
          <div className={cn("p-2 rounded-lg bg-muted", kpi.accent)}>
            <kpi.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-foreground/75 dark:text-muted-foreground text-xs font-medium">
              {kpi.label}
            </p>
            <div className="flex items-center gap-1.5">
              <p className={cn("text-xl font-semibold text-foreground", kpi.accent)}>
                {kpi.value}
              </p>
              {kpi.pulse && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
