import * as React from "react";
import { cn } from "../../utils";

export interface AppHeaderShellProps extends React.HTMLAttributes<HTMLElement> {
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  centerSection?: React.ReactNode;
  isImpersonating?: boolean;
}

export const AppHeaderShell = React.forwardRef<HTMLElement, AppHeaderShellProps>(
  (
    {
      leftSection,
      rightSection,
      centerSection,
      isImpersonating = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <header
        ref={ref}
        className={cn(
          "flex h-12 shrink-0 w-full items-center justify-between border-b px-3 sm:px-4 z-40 py-2 select-none transition-colors",
          isImpersonating
            ? "border-amber-500/30 bg-amber-500/[0.02]"
            : "border-border/80 bg-background",
          className
        )}
        {...props}
      >
        {leftSection && (
          <div className="flex items-center gap-2 min-w-0">
            {leftSection}
          </div>
        )}

        {centerSection && (
          <div className="flex items-center min-w-0">
            {centerSection}
          </div>
        )}

        {rightSection && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {rightSection}
          </div>
        )}

        {children}
      </header>
    );
  }
);
AppHeaderShell.displayName = "AppHeaderShell";
