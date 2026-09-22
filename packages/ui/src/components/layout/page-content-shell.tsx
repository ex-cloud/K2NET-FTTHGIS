import * as React from "react";
import { cn } from "../../utils";

export interface PageContentShellProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "5xl" | "7xl" | "full";
  padded?: boolean;
}

const MAX_WIDTH_MAP = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "7xl": "max-w-7xl",
  full: "w-full",
};

export const PageContentShell = React.forwardRef<HTMLDivElement, PageContentShellProps>(
  ({ children, maxWidth = "7xl", padded = true, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex-1 min-h-0 overflow-y-auto custom-scrollbar-thin bg-background",
          padded && "p-6 md:p-8",
          className
        )}
        {...props}
      >
        <div className={cn("mx-auto w-full", MAX_WIDTH_MAP[maxWidth])}>
          {children}
        </div>
      </div>
    );
  }
);

PageContentShell.displayName = "PageContentShell";
