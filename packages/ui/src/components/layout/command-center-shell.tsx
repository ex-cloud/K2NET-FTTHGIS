import * as React from "react";
import { cn } from "../../utils";

export interface EnterpriseCommandCenterMetaChip {
  label: string;
  count: number | string;
  variant?: "default" | "destructive" | "muted";
}

export interface EnterpriseCommandCenterShellProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  metaChips?: EnterpriseCommandCenterMetaChip[];
  actions?: React.ReactNode;
  kpiGrid?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export interface EnterpriseDataShellProps {
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export interface EnterpriseKpiGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 2 | 3 | 4;
}

/**
 * EnterpriseDataShell
 * Container with rounded-xl border, card background, sticky backdrop-blur toolbar,
 * and scrollable content area. Replicates the proven pattern of /organizations.
 */
export function EnterpriseDataShell({
  toolbar,
  children,
  footer,
  className,
  bodyClassName,
}: EnterpriseDataShellProps) {
  return (
    <div
      className={cn(
        "flex-1 min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden flex flex-col",
        className
      )}
    >
      {toolbar && (
        <div className="relative z-30 bg-background/50 backdrop-blur-sm py-2.5 px-4 md:px-6 shrink-0 border-b border-border/60">
          {toolbar}
        </div>
      )}

      <div
        className={cn(
          "flex-1 overflow-y-auto custom-scrollbar",
          bodyClassName
        )}
      >
        {children}
      </div>

      {footer && <div className="shrink-0">{footer}</div>}
    </div>
  );
}

/**
 * EnterpriseKpiGrid
 * Standard responsive grid wrapper for RichKpiCards.
 */
export function EnterpriseKpiGrid({
  children,
  className,
  columns = 4,
}: EnterpriseKpiGridProps) {
  const colClass =
    columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : columns === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={cn("grid gap-4", colClass, className)}>
      {children}
    </div>
  );
}

/**
 * EnterpriseCommandCenterShell
 * High-level layout shell standardizing the Command Center UI architecture across
 * K2NET FTTH GIS modules (ADR-0019).
 */
export function EnterpriseCommandCenterShell({
  title,
  description,
  icon,
  badge,
  metaChips,
  actions,
  kpiGrid,
  toolbar,
  children,
  footer,
  className,
  contentClassName,
}: EnterpriseCommandCenterShellProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-5 overflow-hidden",
        className
      )}
    >
      {/* 1. Header Section: Title + Description + Meta Chips & Actions */}
      <div className="px-4 md:px-6 shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            {icon && <span className="text-foreground shrink-0">{icon}</span>}
            <span>{title}</span>
            {badge && <span className="ml-1">{badge}</span>}
          </h1>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>

      {/* 2. Meta Chips Line (e.g. 24 Total / 24 Active / 0 Maintenance) */}
      {metaChips && metaChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground/90 font-medium px-4 md:px-6 shrink-0">
          {metaChips.map((chip, idx) => {
            const isDestructive = chip.variant === "destructive";
            const isMuted = chip.variant === "muted";

            return (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <span className="text-muted-foreground/30 px-1">/</span>
                )}
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "font-bold font-mono",
                      isDestructive
                        ? "text-destructive"
                        : isMuted
                        ? "text-muted-foreground"
                        : "text-foreground"
                    )}
                  >
                    {chip.count}
                  </span>
                  <span>{chip.label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* 3. KPI Grid Section */}
      {kpiGrid && (
        <div className="px-4 md:px-6 shrink-0 animate-in fade-in-50 duration-150">
          {kpiGrid}
        </div>
      )}

      {/* 4. Canvas Data Container (Toolbar + Content Table/List) */}
      <div
        className={cn(
          "flex-1 min-h-0 flex gap-4 px-4 md:px-6 pb-6 overflow-hidden",
          contentClassName
        )}
      >
        <EnterpriseDataShell toolbar={toolbar} footer={footer}>
          {children}
        </EnterpriseDataShell>
      </div>
    </div>
  );
}
