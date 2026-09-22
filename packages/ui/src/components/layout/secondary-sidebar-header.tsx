import * as React from "react";
import { PanelLeftClose } from "lucide-react";
import { cn } from "../../utils";

export interface SecondarySidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ElementType;
  onCollapse?: () => void;
  isCollapsed?: boolean;
}

export const SecondarySidebarHeader = React.forwardRef<HTMLDivElement, SecondarySidebarHeaderProps>(
  (
    {
      title,
      badge,
      actions,
      icon: Icon,
      onCollapse,
      isCollapsed = false,
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
          "h-12 py-2 px-4 border-b border-border/40 shrink-0 flex items-center justify-between min-w-[240px] select-none bg-sidebar",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {Icon && <Icon className="w-4 h-4 text-primary shrink-0" />}
          <h3 className="text-sm font-semibold text-foreground tracking-tight truncate">
            {title}
          </h3>
          {badge}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {actions}
          {children}
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

SecondarySidebarHeader.displayName = "SecondarySidebarHeader";

// Alias for convenience
export const SidebarSubHeader = SecondarySidebarHeader;
