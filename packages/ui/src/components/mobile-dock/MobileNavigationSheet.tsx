import * as React from "react";
import { X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "../sheet";
import { Button } from "../button";
import { cn } from "../../utils";
import type { MobileNavigationSheetProps, MobileTabId } from "./types";

export function MobileNavigationSheet({
  open,
  onOpenChange,
  activeTab,
  onTabChange,
  tabs = [],
  children,
  trigger,
  className,
}: MobileNavigationSheetProps) {
  const handleTabClick = (tabId: MobileTabId) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          "w-full h-[88vh] max-h-[90vh] sm:max-w-2xl sm:mx-auto bg-sidebar border-t border-border rounded-t-2xl p-0 dark text-foreground flex flex-col overflow-hidden shadow-xl",
          className
        )}
      >
        {/* TOP GRAB HANDLE */}
        <div className="mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-muted-foreground/30 shrink-0" aria-hidden="true" />

        {/* TOP DOCK HEADER (Directly Aligned Icons) */}
        {tabs.length > 0 && (
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/70 bg-background/95 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar py-0.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isAi = tab.id === "ai";

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabClick(tab.id)}
                    className={cn(
                      "size-8 rounded-lg flex items-center justify-center transition-all relative cursor-pointer select-none shrink-0",
                      isActive
                        ? isAi
                          ? "bg-primary/10 text-primary font-semibold border border-primary/30 shadow-xs"
                          : "bg-muted text-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                    title={tab.title}
                    aria-label={tab.title}
                  >
                    <Icon className={cn("size-4", isAi && !isActive && "text-primary")} />
                    {typeof tab.badgeCount === "number" && tab.badgeCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 size-2 bg-destructive rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer shrink-0 ml-2"
              title="Tutup Modal"
              aria-label="Tutup Modal"
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        {/* DYNAMIC TAB BODY */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
