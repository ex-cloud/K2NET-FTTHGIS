import React from "react";
import { cn } from "@/lib/utils";

export interface KpiMiniBarChartProps {
  label: string;
  meta: string;
  bars?: number[];
  count?: number;
  variant?: "active" | "urgent" | "resolved";
  color?: "primary" | "destructive" | "amber";
  unit?: string;
  className?: string;
}

/**
 * Deterministically generates a 7-bar activity sparkline reflecting a given count.
 * When count is 0, returns flat baseline bars [0, 0, 0, 0, 0, 0, 0].
 */
export function generateCountSparkline(
  count: number,
  variant: "active" | "urgent" | "resolved" = "active"
): number[] {
  if (count <= 0) {
    return [0, 0, 0, 0, 0, 0, 0];
  }
  if (count === 1) {
    return [0, 0, 0, 0, 0, 0, 1];
  }
  if (count === 2) {
    return [0, 0, 1, 0, 0, 0, 1];
  }
  if (count === 3) {
    return [0, 1, 0, 1, 0, 0, 1];
  }

  // Relative distribution curve with slight activity ramp towards today
  const weightsByVariant: Record<string, number[]> = {
    active: [0.35, 0.5, 0.4, 0.7, 0.6, 0.85, 1.0],
    urgent: [0.1, 0.3, 0.2, 0.5, 0.4, 0.8, 1.0],
    resolved: [0.4, 0.6, 0.5, 0.75, 0.8, 0.9, 1.0],
  };

  const weights = weightsByVariant[variant] || weightsByVariant.active;
  return weights.map((w) => Math.max(1, Math.round((count * w) / 2)));
}

/**
 * Modern Telemetry Mini Bar Chart (Option 1) for KPI strip cards.
 * Replaces arbitrary percentage progress bars with discrete activity/volume telemetry bars.
 */
export function KpiMiniBarChart({
  label,
  meta,
  bars,
  count,
  variant = "active",
  color = "primary",
  unit = "",
  className,
}: KpiMiniBarChartProps) {
  const displayBars = bars ?? (count !== undefined ? generateCountSparkline(count, variant) : [0, 0, 0, 0, 0, 0, 0]);
  const maxVal = Math.max(...displayBars, 1);
  const isAllZero = displayBars.every((v) => v === 0);

  const barColorClass =
    color === "destructive"
      ? "bg-destructive"
      : color === "amber"
      ? "bg-foreground/80"
      : "bg-foreground";

  return (
    <div
      className={cn(
        "pt-2.5 border-t border-border/40 flex items-end justify-between gap-2.5",
        className
      )}
    >
      <div className="space-y-0.5 min-w-0">
        <span className="text-[11px] font-medium text-muted-foreground block truncate">
          {label}
        </span>
        <span className="text-xs font-mono font-semibold text-foreground/90 block truncate">
          {meta}
        </span>
      </div>

      <div
        className="flex items-end gap-1 h-7 shrink-0"
        role="img"
        aria-label={`${label}: ${meta}`}
      >
        {displayBars.map((val, idx) => {
          const isZero = val === 0;
          // When all zero or bar is zero, display subtle baseline (14% height, 20% opacity)
          const heightPct = isAllZero
            ? 14
            : isZero
            ? 14
            : Math.max(22, Math.round((val / maxVal) * 100));

          return (
            <div
              key={idx}
              title={unit ? `${val} ${unit}` : `${val}`}
              className={cn(
                "w-1.5 rounded-xs transition-all duration-300",
                barColorClass,
                isZero
                  ? "opacity-20"
                  : "opacity-85 hover:opacity-100 hover:scale-y-110"
              )}
              style={{ height: `${heightPct}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
