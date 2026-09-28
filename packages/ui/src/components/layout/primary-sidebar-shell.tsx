import * as React from "react";
import { cn } from "../../utils";

export interface PrimarySidebarShellProps extends React.HTMLAttributes<HTMLElement> {
  isExpanded?: boolean;
  isFloating?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  topSection?: React.ReactNode;
  bottomSection?: React.ReactNode;
}

export const PrimarySidebarShell = React.forwardRef<HTMLElement, PrimarySidebarShellProps>(
  (
    {
      isExpanded = false,
      isFloating = false,
      onMouseEnter,
      onMouseLeave,
      topSection,
      bottomSection,
      className,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const floatingStyle: React.CSSProperties = isFloating
      ? {
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          boxShadow: "none",
          ...style,
        }
      : { ...style };

    return (
      <>
        {isFloating && (
          <div className="hidden md:block w-[50px] shrink-0 h-full" />
        )}

        <aside
          ref={ref}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          style={floatingStyle}
          className={cn(
            "hidden md:flex border-r border-border/80 flex-col bg-sidebar shrink-0 h-full transition-all duration-300 ease-in-out overflow-hidden select-none",
            isFloating ? "" : "z-50",
            isExpanded ? "w-[200px]" : "w-[50px]",
            className
          )}
          {...props}
        >
          <div className="flex flex-col h-full py-4">
            {topSection}
            {children}
            <div className="flex-1" />
            {bottomSection}
          </div>
        </aside>
      </>
    );
  }
);
PrimarySidebarShell.displayName = "PrimarySidebarShell";
