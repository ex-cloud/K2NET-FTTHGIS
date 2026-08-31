

import * as React from "react";
import { PanelLeftDashed } from "lucide-react";
import { Button } from "@k2net/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@k2net/ui";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  useSidebarMode,
  type SidebarMode,
} from "@/components/sidebar-mode-context";

export function SidebarControl({ isExpanded = false }: { isExpanded?: boolean }) {
  const isMobile = useIsMobile();
  const { sidebarMode, setSidebarMode } = useSidebarMode();

  const handleModeChange = (newMode: SidebarMode) => {
    setSidebarMode(newMode);
  };

  if (isMobile) return null; // Hide on mobile

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 rounded-md"
          >
            <PanelLeftDashed
              className="h-3.5 w-3.5"
              strokeWidth={1.5}
            />
            <span className="sr-only">Sidebar Control</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="right"
          className="w-48 bg-popover border-border shadow-2xl p-1 animate-in fade-in zoom-in duration-200"
          sideOffset={10}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-2 text-[9px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-[0.2em]">
              Display Mode
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={() => handleModeChange("expanded")}
              className="flex items-center gap-3 px-2 py-2.5 focus:bg-primary/10 cursor-pointer rounded-sm group transition-colors"
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${sidebarMode === "expanded" ? "border-primary bg-primary/20" : "border-border bg-transparent"}`}
              >
                {sidebarMode === "expanded" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                )}
              </div>
              <span className={`text-xs font-semibold ${sidebarMode === "expanded" ? "text-primary" : "text-foreground/80 dark:text-muted-foreground group-hover:text-foreground"}`}>
                Expanded
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleModeChange("collapsed")}
              className="flex items-center gap-3 px-2 py-2.5 focus:bg-primary/10 cursor-pointer rounded-sm group transition-colors"
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${sidebarMode === "collapsed" ? "border-primary bg-primary/20" : "border-border bg-transparent"}`}
              >
                {sidebarMode === "collapsed" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                )}
              </div>
              <span className={`text-xs font-semibold ${sidebarMode === "collapsed" ? "text-primary" : "text-foreground/80 dark:text-muted-foreground group-hover:text-foreground"}`}>
                Collapsed
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleModeChange("hover")}
              className="flex items-center gap-3 px-2 py-2.5 focus:bg-primary/10 cursor-pointer rounded-sm group transition-colors"
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${sidebarMode === "hover" ? "border-primary bg-primary/20" : "border-border bg-transparent"}`}
              >
                {sidebarMode === "hover" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className={`text-xs font-semibold ${sidebarMode === "hover" ? "text-primary" : "text-foreground/80 dark:text-muted-foreground group-hover:text-foreground"}`}>
                  Expand on Hover
                </span>
                <span className="text-[9px] text-muted-foreground/60 font-medium">Reveals on mouse enter</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
