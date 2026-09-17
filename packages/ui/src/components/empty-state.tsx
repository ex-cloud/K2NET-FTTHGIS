import * as React from "react";
import { cn } from "../utils";

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  compact?: boolean;
}

/**
 * EmptyState - Supabase Studio style Empty State Component
 * Clean, subtle icon wrapper, clear title, concise subtitle, and focused CTA.
 */
export function EmptyState({
  className,
  icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-border/80 bg-card/40",
        compact ? "py-8 px-4" : "py-14 px-6",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="size-10 md:size-12 rounded-full bg-muted/60 border border-border/60 flex items-center justify-center text-muted-foreground mb-3">
          {icon}
        </div>
      )}
      <div className="space-y-1 max-w-sm">
        {typeof title === "string" ? (
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h3>
        ) : (
          title
        )}
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {(action || secondaryAction) && (
        <div className="flex items-center gap-2.5 mt-4">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
