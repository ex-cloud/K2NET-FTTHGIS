import * as React from "react";
import { cn } from "../../utils";
import { Card } from "../card";

export interface RichKpiCardProps {
  title: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  sparkline?: React.ReactNode;
  sparklineBars?: number[];
  sparklineCount?: number;
  sparklineLabel?: string;
  sparklineMeta?: string;
  sparklineVariant?: "active" | "urgent" | "resolved";
  sparklineColor?: "primary" | "destructive" | "amber";
  className?: string;
  glowingEffect?: boolean;
  onClick?: () => void;
}

/**
 * Deterministically generates a 7-bar activity sparkline reflecting a given count.
 */
function generateSparklineBars(
  count: number,
  variant: "active" | "urgent" | "resolved" = "active"
): number[] {
  if (count <= 0) return [0, 0, 0, 0, 0, 0, 0];
  if (count === 1) return [0, 0, 0, 0, 0, 0, 1];
  if (count === 2) return [0, 0, 1, 0, 0, 0, 1];
  if (count === 3) return [0, 1, 0, 1, 0, 0, 1];

  const weightsByVariant: Record<string, number[]> = {
    active: [0.35, 0.5, 0.4, 0.7, 0.6, 0.85, 1.0],
    urgent: [0.1, 0.3, 0.2, 0.5, 0.4, 0.8, 1.0],
    resolved: [0.4, 0.6, 0.5, 0.75, 0.8, 0.9, 1.0],
  };

  const weights = weightsByVariant[variant] || weightsByVariant.active;
  return weights.map((w) => Math.max(1, Math.round((count * w) / 2)));
}

/**
 * RichKpiCard
 * High-performance enterprise KPI Card with glowing effect, font-mono numbers,
 * 2-line descriptions, and built-in telemetry mini-bar sparkline.
 */
export function RichKpiCard({
  title,
  value,
  subValue,
  description,
  icon,
  sparkline,
  sparklineBars,
  sparklineCount,
  sparklineLabel,
  sparklineMeta,
  sparklineVariant = "active",
  sparklineColor = "primary",
  className,
  glowingEffect = true,
  onClick,
}: RichKpiCardProps) {
  // Render sparkline if provided explicitly or via sparklineCount/sparklineBars
  const hasSparklineTelemetry =
    sparkline !== undefined ||
    sparklineBars !== undefined ||
    sparklineCount !== undefined ||
    sparklineLabel !== undefined;

  const displayBars =
    sparklineBars ??
    (sparklineCount !== undefined
      ? generateSparklineBars(sparklineCount, sparklineVariant)
      : [0, 0, 0, 0, 0, 0, 0]);

  const maxVal = Math.max(...displayBars, 1);
  const isAllZero = displayBars.every((v) => v === 0);

  const barColorClass =
    sparklineColor === "destructive"
      ? "bg-destructive"
      : sparklineColor === "amber"
      ? "bg-foreground/80"
      : "bg-foreground";

  return (
    <Card
      glowingEffect={glowingEffect}
      onClick={onClick}
      className={cn(
        "p-5 flex flex-col justify-between gap-3 select-none transition-colors",
        onClick && "cursor-pointer hover:border-foreground/40",
        className
      )}
    >
      {/* 1. Header: Monospace Title & Uniform Icon Box */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono truncate">
          {title}
        </span>
        {icon && (
          <div className="h-6 w-6 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-foreground shrink-0">
            {icon}
          </div>
        )}
      </div>

      {/* 2. Body: Primary Value + Ratio/Badge + 2-Line Description */}
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {value}
          </p>
          {subValue && (
            <span className="text-xs font-mono text-muted-foreground truncate">
              {subValue}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* 3. Footer: Telemetry Mini-Bar Sparkline Slot */}
      {sparkline ? (
        sparkline
      ) : hasSparklineTelemetry ? (
        <div className="pt-2.5 border-t border-border/40 flex items-end justify-between gap-2.5">
          <div className="space-y-0.5 min-w-0">
            {sparklineLabel && (
              <span className="text-[11px] font-medium text-muted-foreground block truncate">
                {sparklineLabel}
              </span>
            )}
            {sparklineMeta && (
              <span className="text-xs font-mono font-semibold text-foreground/90 block truncate">
                {sparklineMeta}
              </span>
            )}
          </div>

          <div
            className="flex items-end gap-1 h-7 shrink-0"
            role="img"
            aria-label={`${sparklineLabel || title}: ${sparklineMeta || value}`}
          >
            {displayBars.map((val, idx) => {
              const isZero = val === 0;
              const heightPct = isAllZero
                ? 14
                : isZero
                ? 14
                : Math.max(22, Math.round((val / maxVal) * 100));

              return (
                <div
                  key={idx}
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
      ) : null}
    </Card>
  );
}
