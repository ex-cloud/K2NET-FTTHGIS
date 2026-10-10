import * as React from "react";
import { cn } from "../../utils";
import { Badge } from "../badge";

export interface PageHeroProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /**
   * Eyebrow pill text or custom badge component (e.g. "B2B CONTRACTS & ENTERPRISE LICENSING").
   * If a string is passed, it is automatically rendered inside a semantic Badge.
   */
  eyebrow?: React.ReactNode;
  /**
   * Main title heading (e.g. "Billing & Licenses Command Center").
   */
  title: React.ReactNode;
  /**
   * Leading Lucide icon rendered before the title with primary accent coloring.
   */
  icon?: React.ElementType;
  /**
   * Explanatory subtitle paragraph.
   */
  subtitle?: React.ReactNode;
  /**
   * In-line meta stats row slot below subtitle (e.g. "4 Active / 0 Provisioning / 0 Suspended / 5 Total").
   */
  meta?: React.ReactNode;
  /**
   * Right-aligned action buttons or controls (e.g. Refresh, Create CTA).
   */
  actions?: React.ReactNode;
  /**
   * Whether to include the standard bottom divider border and padding.
   * Defaults to true.
   */
  bordered?: boolean;
}

export const PageHero = React.forwardRef<HTMLDivElement, PageHeroProps>(
  (
    {
      eyebrow,
      title,
      icon: Icon,
      subtitle,
      meta,
      actions,
      bordered = true,
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
          "w-full",
          bordered && "border-b border-border pb-5 md:pb-6",
          className
        )}
        {...props}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            {eyebrow && (
              <div className="flex items-center gap-2">
                {typeof eyebrow === "string" ? (
                  <Badge
                    variant="default"
                    className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5"
                  >
                    {eyebrow}
                  </Badge>
                ) : (
                  eyebrow
                )}
              </div>
            )}

            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
              {Icon && <Icon className="size-5 md:size-6 text-primary shrink-0" />}
              <span className="truncate">{title}</span>
            </h1>

            {subtitle && (
              <p className="text-xs text-foreground/75 dark:text-muted-foreground leading-relaxed max-w-4xl">
                {subtitle}
              </p>
            )}

            {meta && (
              <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground/90 font-medium pt-1">
                {meta}
              </div>
            )}
          </div>

          {(actions || children) && (
            <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
              {actions}
              {children}
            </div>
          )}
        </div>
      </div>
    );
  }
);

PageHero.displayName = "PageHero";
