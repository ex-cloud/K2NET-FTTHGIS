

import React from "react";
import {
  ClipboardList,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { useTaskSummary, type TaskSummary } from "@/hooks/useTaskSummary";
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
  ratioLabel,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  percent: number;
  color: "primary" | "destructive" | "amber" | "sky";
  pulse?: boolean;
  ratioLabel: string;
}) {
  const colorMap = {
    primary: {
      icon: "text-foreground",
      bar: "bg-foreground",
    },
    destructive: {
      icon: "text-destructive",
      bar: "bg-destructive",
    },
    amber: {
      icon: "text-foreground/80",
      bar: "bg-foreground/80",
    },
    sky: {
      icon: "text-foreground",
      bar: "bg-foreground",
    },
  };
  const c = colorMap[color];
  const barColor = c.bar;

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
        <p className="text-2xl font-bold text-foreground font-mono">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{ratioLabel}</span>
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
interface TaskKpiStripProps {
  summaryProp?: TaskSummary | null;
  isSupport?: boolean;
}

export function TaskKpiStrip({ summaryProp, isSupport }: TaskKpiStripProps = {}) {
  const { t } = useTranslation();
  const { summary: fetchedSummary, loading: hookLoading } = useTaskSummary();
  const summary = summaryProp !== undefined ? summaryProp : fetchedSummary;
  const loading = summaryProp !== undefined ? false : hookLoading;

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
        label={isSupport ? t("support.kpi_open_tickets") : t("tasks.active_issues")}
        value={totalOpen}
        sub={`${grandTotal} ${isSupport ? t("support.kpi_total_tickets") : t("tasks.total")}`}
        percent={activePct}
        color="primary"
        ratioLabel={isSupport ? t("support.kpi_open_tickets") : t("tasks.active_issues")}
      />
      <MetricCard
        icon={AlertCircle}
        label={t("tasks.urgent")}
        value={urgentCount}
        sub={t("workspace.kpi_at_risk_desc")}
        percent={urgentPct}
        color="destructive"
        pulse={urgentCount > 0}
        ratioLabel={t("tasks.urgent")}
      />
      <MetricCard
        icon={CheckCircle2}
        label={t("tasks.resolved_today")}
        value={resolvedToday}
        sub={t("support.kpi_resolved_desc")}
        percent={resolvedPct}
        color="primary"
        ratioLabel={t("tasks.resolved_today")}
      />
    </div>
  );
}
