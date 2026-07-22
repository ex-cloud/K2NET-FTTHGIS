import * as React from "react";
import { cn } from "../utils";

export interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * The variant of the layout.
   * - "dashboard": Scrollable layout with max-w-[95rem] and standard padding.
   * - "workspace": Height-restricted layout, suitable for pages with data tables or split sidebars.
   */
  variant?: "dashboard" | "workspace";
  /**
   * Maximum width of the content area.
   * Defaults to "max-w-[95rem]" (1520px) for both variants, but can be overridden (e.g. "max-w-5xl").
   */
  maxWidth?: string;
  /**
   * Optional side panel (e.g., filter panel) for workspace layout.
   */
  sidePanel?: React.ReactNode;
  /**
   * Spacing classes for vertical content.
   * Defaults to "space-y-8" for dashboard, and "space-y-6" for workspace.
   */
  spaceY?: string;
}

export function PageLayout({
  children,
  variant = "dashboard",
  maxWidth = "page-layout-container",
  sidePanel,
  spaceY,
  className,
  ...props
}: PageLayoutProps) {
  if (variant === "workspace") {
    return (
      <div className="flex-1 flex w-full min-h-0 overflow-hidden bg-background relative">
        <div className="flex-1 w-full min-w-0 px-6 md:px-12 xl:px-16 py-4 md:py-8 overflow-hidden">
          <div
            className={cn(
              "w-full pb-8 h-full flex flex-col mx-auto",
              spaceY || "space-y-6",
              maxWidth,
              className
            )}
            {...props}
          >
            {children}
          </div>
        </div>
        {sidePanel}
      </div>
    );
  }

  // Dashboard variant (scrollable, standard dashboard pages)
  return (
    <div className="relative flex h-full flex-1 flex-col overflow-y-auto bg-background px-6 md:px-12 xl:px-16 pt-16">
      {/* Ambient Background Glow Mesh for Glassmorphism Backdrop Blur Contrast */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 opacity-40 dark:opacity-30">
        <div className="absolute -top-[20%] left-[10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-[30%] right-[5%] h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute top-[60%] left-[20%] h-[400px] w-[400px] rounded-full bg-sky-500/10 blur-[120px]" />
      </div>

      <div
        className={cn(
          "relative z-10 w-full pb-20 mx-auto",
          spaceY || "space-y-8",
          maxWidth,
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}
