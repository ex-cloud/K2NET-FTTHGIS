

import React from "react";
import {
  ClipboardList,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@k2net/ui";
import { useTaskSummary } from "@/hooks/useTaskSummary";
import { cn } from "@/lib/utils";

// ─── MetricCard: Compute-style vertical card with progress bar ─────────────────
function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  percent,
  color,
  pulse,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  percent: number;
  color: "primary" | "destructive" | "amber" | "sky";
  pulse?: boolean;
}) {
  const colorMap = {
    primary: {
      icon: "text-primary",
      bar: "bg-primary",
    },
    destructive: {
      icon: "text-destructive",
      bar: "bg-destructive",
    },
    amber: {
      icon: "text-amber-500 dark:text-amber-400",
      bar: "bg-amber-500",
    },
    sky: {
      icon: "text-sky-500 dark:text-sky-400",
      bar: "bg-sky-500",
    },
  };
  const c = colorMap[color];
  const barColor =
    color === "primary" && percent > 90
      ? "bg-rose-500"
      : color === "primary" && percent > 75
      ? "bg-amber-500"
      : c.bar;

  return (
    <Card glowingEffect className="p-5 flex flex-col gap-3">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase">
          {label}
        </span>
        <div className="relative flex items-center">
          {pulse && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
            </span>
          )}
          <Icon className={cn("h-4 w-4", c.icon)} />
        </div>
      </div>

      {/* Value + Sub */}
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Utilization</span>
          <span>{Math.min(Math.round(percent), 100)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", barColor)}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

// ─── Main TaskKpiStrip ─────────────────────────────────────────────────────────
export function TaskKpiStrip() {
  const { summary, loading } = useTaskSummary();

  const totalOpen = summary?.totalOpen ?? 0;
  const urgentCount = summary?.urgentCount ?? 0;
  const resolvedToday = summary?.resolvedToday ?? 0;
  const grandTotal = totalOpen + resolvedToday;

  // Derived percents
  const activePct = grandTotal > 0 ? Math.round((totalOpen / grandTotal) * 100) : 0;
  const urgentPct = totalOpen > 0 ? Math.round((urgentCount / totalOpen) * 100) : 0;
  const resolvedPct = grandTotal > 0 ? Math.round((resolvedToday / grandTotal) * 100) : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="p-5 flex flex-col gap-3 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-3 bg-muted rounded w-20" />
              <div className="h-4 w-4 bg-muted rounded" />
            </div>
            <div>
              <div className="h-8 bg-muted rounded w-12 mb-1" />
              <div className="h-3 bg-muted rounded w-28" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <div className="h-3 bg-muted rounded w-14" />
                <div className="h-3 bg-muted rounded w-8" />
              </div>
              <div className="h-1.5 bg-muted rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      <MetricCard
        icon={ClipboardList}
        label="Active Tasks"
        value={totalOpen}
        sub={`${grandTotal} total created`}
        percent={activePct}
        color="primary"
      />
      <MetricCard
        icon={AlertCircle}
        label="Urgent"
        value={urgentCount}
        sub="Immediate attention needed"
        percent={urgentPct}
        color="destructive"
        pulse={urgentCount > 0}
      />
      <MetricCard
        icon={CheckCircle2}
        label="Resolved Today"
        value={resolvedToday}
        sub="Tickets closed today"
        percent={resolvedPct}
        color="sky"
      />
    </div>
  );
}
