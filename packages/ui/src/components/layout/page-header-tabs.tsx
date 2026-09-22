import * as React from "react";
import { cn } from "../../utils";

export interface PageTabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number | string;
  icon?: React.ElementType;
  disabled?: boolean;
}

export interface PageHeaderTabsProps<T extends string = string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  tabs: PageTabItem<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
  actions?: React.ReactNode;
}

export function PageHeaderTabs<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  actions,
  className,
  ...props
}: PageHeaderTabsProps<T>) {
  return (
    <div
      className={cn(
        "px-6 border-b border-border/40 flex items-center justify-between gap-6 bg-background/50 backdrop-blur-xs select-none overflow-x-auto custom-scrollbar-thin shrink-0",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-6">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const TabIcon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 py-3 text-xs font-medium border-b-2 transition-all duration-150 cursor-pointer shrink-0",
                isActive
                  ? "border-primary text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60",
                tab.disabled && "opacity-40 cursor-not-allowed pointer-events-none"
              )}
            >
              {TabIcon && (
                <TabIcon
                  className={cn(
                    "w-3.5 h-3.5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
              )}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count !== null && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-mono transition-colors",
                    isActive
                      ? "bg-primary/15 text-primary font-bold"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {actions && <div className="flex items-center gap-2 py-2 shrink-0">{actions}</div>}
    </div>
  );
}
