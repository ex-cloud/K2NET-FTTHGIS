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
  /**
   * Show a large, subtle, centered watermark pattern of the logo.
   */
  showLogoWatermark?: boolean;
}

export function PageLayout({
  children,
  variant = "dashboard",
  maxWidth = "page-layout-container",
  sidePanel,
  spaceY,
  className,
  showLogoWatermark = false,
  ...props
}: PageLayoutProps) {
  if (variant === "workspace") {
    return (
      <div className="flex-1 flex w-full min-h-0 overflow-hidden bg-background relative">
        {showLogoWatermark && (
          <div 
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] md:w-[500px] md:h-[500px] z-0 opacity-[0.02] dark:opacity-[0.035] select-none"
            style={{
              backgroundImage: "url('/logo-watermark.svg')",
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
        )}
        <div className="flex-1 w-full min-w-0 px-6 md:px-12 xl:px-16 py-4 md:py-8 overflow-hidden relative z-10">
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
      {showLogoWatermark && (
        <div 
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] md:w-[500px] md:h-[500px] z-0 opacity-[0.02] dark:opacity-[0.035] select-none"
          style={{
            backgroundImage: "url('/logo-watermark.svg')",
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}

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
