import * as React from "react";
import { cn } from "../../utils";
import type { MobileFloatingDockProps, FloatingDockItem } from "./types";

export function MobileFloatingDock({
  items,
  className,
  containerClassName,
}: MobileFloatingDockProps) {
  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex md:hidden pointer-events-auto",
        containerClassName
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1 bg-popover/95 backdrop-blur-xl border border-border/80 text-foreground shadow-lg rounded-full px-2.5 py-1.5 text-xs animate-in fade-in slide-in-from-bottom-4 duration-300",
          className
        )}
      >
        {items.map((item, index) => {
          const Icon = item.icon;
          const isPrimary = item.variant === "primary";
          const isAi = item.id === "ai";
          const isLast = index === items.length - 1;
          const showSeparator = isPrimary && !isLast;

          return (
            <React.Fragment key={item.id}>
              {/* Optional separator before primary button if it's the last navigation menu button */}
              {isPrimary && index > 0 && (
                <div className="h-4 w-px bg-border/60 mx-0.5" aria-hidden="true" />
              )}

              <button
                type="button"
                onClick={item.onClick}
                className={cn(
                  "p-2 rounded-full transition-all relative cursor-pointer flex items-center justify-center select-none active:scale-95",
                  isPrimary
                    ? "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                    : isAi
                    ? "hover:bg-muted text-primary hover:text-primary"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                title={item.title || item.label}
                aria-label={item.ariaLabel || item.label}
              >
                <Icon className="size-4 shrink-0" />
                {typeof item.badgeCount === "number" && item.badgeCount > 0 && (
                  <span className="absolute top-1 right-1 size-2 bg-destructive rounded-full ring-2 ring-popover" />
                )}
              </button>

              {showSeparator && (
                <div className="h-4 w-px bg-border/60 mx-0.5" aria-hidden="true" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
