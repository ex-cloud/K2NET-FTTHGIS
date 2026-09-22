import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "../../utils";
import { Skeleton } from "../skeleton";

export interface MetricTrend {
  value: number | string;
  isPositive?: boolean;
  label?: string;
}

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  trend?: MetricTrend;
  icon?: React.ElementType;
  variant?: "flat" | "groove";
  loading?: boolean;
  description?: string;
  badge?: React.ReactNode;
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      label,
      value,
      trend,
      icon: Icon,
      variant = "flat",
      loading = false,
      description,
      badge,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl bg-card border border-border/70 p-5 flex flex-col justify-between transition-all duration-200 shadow-xs relative overflow-hidden",
          variant === "groove" && "border-groove-t border-groove-b",
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-semibold text-foreground/75 dark:text-muted-foreground tracking-tight truncate block">
              {label}
            </span>
            {loading ? (
              <Skeleton className="h-8 w-24 my-1" />
            ) : (
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {value}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {badge}
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Icon className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>

        {(trend || description || children) && (
          <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
            {trend && (
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className={cn(
                    "inline-flex items-center font-semibold font-mono",
                    trend.isPositive ? "text-emerald-500" : "text-rose-500"
                  )}
                >
                  {trend.isPositive ? (
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                  )}
                  {trend.value}
                </span>
                {trend.label && (
                  <span className="text-muted-foreground/70">{trend.label}</span>
                )}
              </div>
            )}

            {description && (
              <p className="text-xs text-muted-foreground/80 leading-relaxed">
                {description}
              </p>
            )}

            {children}
          </div>
        )}
      </div>
    );
  }
);

MetricCard.displayName = "MetricCard";
