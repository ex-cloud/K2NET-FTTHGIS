import * as React from "react";
import { cn } from "../utils";

export type StatusDotVariant = "success" | "destructive" | "warning" | "neutral" | "primary";

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusDotVariant;
  pulse?: boolean;
  label?: React.ReactNode;
}

const variantDotColors: Record<StatusDotVariant, string> = {
  success: "bg-primary",
  destructive: "bg-destructive",
  warning: "bg-amber-500",
  neutral: "bg-muted-foreground/60",
  primary: "bg-primary",
};

/**
 * StatusDot - Supabase Studio style live telemetry / status indicator dot.
 */
export function StatusDot({
  className,
  variant = "success",
  pulse = false,
  label,
  ...props
}: StatusDotProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-foreground", className)}
      {...props}
    >
      <span className="relative flex size-2 shrink-0">
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              variantDotColors[variant]
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            variantDotColors[variant]
          )}
        />
      </span>
      {label && <span className="truncate">{label}</span>}
    </span>
  );
}
