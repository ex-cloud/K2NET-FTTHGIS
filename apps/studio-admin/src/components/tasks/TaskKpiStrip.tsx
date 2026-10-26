

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

import { KpiMiniBarChart } from "@/components/tasks/KpiMiniBarChart";

// ─── MetricCard: Modern Telemetry Card with Mini Bar Chart (Option 1) ───────
function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  pulse,
  chartLabel,
  chartMeta,
  count,
  variant,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  color: "primary" | "destructive" | "amber";
  pulse?: boolean;
  chartLabel: string;
  chartMeta: string;
  count: number;
  variant: "active" | "urgent" | "resolved";
}) {
  const iconColor = color === "destructive" ? "text-destructive" : "text-foreground";

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
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </div>

      {/* Value + Sub */}
      <div>
        <p className="text-2xl font-bold text-foreground font-mono">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>

      {/* Mini Bar Chart Activity Sparkline */}
      <KpiMiniBarChart
        label={chartLabel}
        meta={chartMeta}
        count={count}
        variant={variant}
        color={color}
      />
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
            <div className="pt-2.5 border-t border-border/40 flex items-end justify-between">
              <div className="h-3 bg-muted rounded w-16" />
              <div className="flex items-end gap-1 h-7">
                {[0, 1, 2, 3, 4, 5, 6].map((b) => (
                  <div key={b} className="w-1.5 h-3 bg-muted rounded-xs" />
                ))}
              </div>
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
        chartLabel={isSupport ? t("support.kpi_queue_trend") : t("tasks.kpi_volume_trend")}
        chartMeta={`${totalOpen} ${isSupport ? t("support.kpi_in_queue") : t("tasks.kpi_in_queue")}`}
        count={totalOpen}
        variant="active"
        color="primary"
      />
      <MetricCard
        icon={AlertCircle}
        label={t("tasks.urgent")}
        value={urgentCount}
        sub={t("workspace.kpi_at_risk_desc")}
        chartLabel={isSupport ? t("support.kpi_sla_risk_telemetry") : t("tasks.kpi_critical_alerts")}
        chartMeta={urgentCount > 0 ? `${urgentCount} ${t("support.kpi_urgent_tickets")}` : t("support.kpi_zero_sla_risk")}
        count={urgentCount}
        variant="urgent"
        color={urgentCount > 0 ? "destructive" : "primary"}
        pulse={urgentCount > 0}
      />
      <MetricCard
        icon={CheckCircle2}
        label={t("tasks.resolved_today")}
        value={resolvedToday}
        sub={t("support.kpi_resolved_desc")}
        chartLabel={isSupport ? t("support.kpi_resolution_velocity") : t("tasks.kpi_closed_trend")}
        chartMeta={`${resolvedToday} ${isSupport ? t("support.kpi_closed_today") : t("tasks.resolved_today")}`}
        count={resolvedToday}
        variant="resolved"
        color="primary"
      />
    </div>
  );
}
