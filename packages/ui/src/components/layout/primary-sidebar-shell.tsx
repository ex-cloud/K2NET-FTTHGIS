import * as React from "react";
import { cn } from "../../utils";
import { SidebarModeControl } from "./sidebar-mode-control";
import { AppVersionBadge } from "./app-version-badge";

export interface PrimarySidebarShellProps extends React.HTMLAttributes<HTMLElement> {
  isExpanded?: boolean;
  isFloating?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  topSection?: React.ReactNode;
  bottomNav?: React.ReactNode;
  footerControl?: React.ReactNode;
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
      bottomNav,
      footerControl,
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

            {/* Standardized Bottom Nav with groove border (if provided) */}
            {bottomNav && (
              <nav className="flex flex-col gap-1 px-2 border-groove-t pt-2.5 mb-2">
                {bottomNav}
              </nav>
            )}

            {/* Standardized Footer Control: Sidebar Mode Toggle + Version Badge */}
            {bottomSection ?? (
              <div className="flex flex-col px-2">
                <div className="flex items-center justify-between rounded-lg h-8 w-full pl-[5px] pr-1">
                  {footerControl ?? <SidebarModeControl isExpanded={isExpanded} />}
                  {isExpanded && <AppVersionBadge />}
                </div>
              </div>
            )}
          </div>
        </aside>
      </>
    );
  }
);
PrimarySidebarShell.displayName = "PrimarySidebarShell";
