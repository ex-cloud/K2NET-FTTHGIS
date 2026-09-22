import * as React from "react";
import { cn } from "../../utils";

export interface SecondarySidebarShellProps extends React.HTMLAttributes<HTMLElement> {
  isCollapsed?: boolean;
  width?: string;
  header?: React.ReactNode;
}

export const SecondarySidebarShell = React.forwardRef<HTMLElement, SecondarySidebarShellProps>(
  (
    {
      isCollapsed = false,
      width = "w-[240px]",
      header,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <aside
        ref={ref}
        className={cn(
          "transition-all duration-300 ease-in-out shrink-0 bg-sidebar h-full hidden md:flex flex-col overflow-hidden",
          isCollapsed ? "w-0 border-r-0" : cn(width, "border-r border-border/40"),
          className
        )}
        {...props}
      >
        {header}
        <div className="flex-1 overflow-y-auto custom-scrollbar-thin p-3 space-y-6 min-w-[240px]">
          {children}
        </div>
      </aside>
    );
  }
);

SecondarySidebarShell.displayName = "SecondarySidebarShell";
