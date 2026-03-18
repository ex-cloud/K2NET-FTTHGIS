"use client";

import * as React from "react";
import { PanelLeftDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useSidebarMode,
  type SidebarMode,
} from "@/components/sidebar-mode-context";

export function SidebarControl() {
  const isMobile = useIsMobile();
  const { sidebarMode, setSidebarMode } = useSidebarMode();

  const handleModeChange = (newMode: SidebarMode) => {
    setSidebarMode(newMode);
    // The context's setSidebarMode already updates the open state in the context,
    // which is then passed to the SidebarProvider in the layout.
  };

  if (isMobile) return null; // Hide on mobile

  return (
    <div className="flex items-center px-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors rounded-md"
          >
            <PanelLeftDashed
              className="h-4 w-4"
              strokeWidth={1}
              fill="none"
              stroke="currentColor"
            />
            <span className="sr-only">Sidebar Control</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="top"
          className="w-40 bg-popover border-border shadow-2xl p-1"
          sideOffset={15}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-1.5 text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
              Sidebar control
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={() => handleModeChange("expanded")}
              className="flex items-center align-center px-2 py-2 hover:bg-accent focus:bg-accent cursor-pointer rounded-sm group transition-colors"
            >
              <div
                className={`w-3 h-3 rounded-full border border-border flex items-center justify-center ${sidebarMode === "expanded" ? "border-emerald-500 bg-emerald-500/10" : "bg-transparent"}`}
              >
                {sidebarMode === "expanded" && (
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                )}
              </div>
              <span className="text-xs font-medium text-foreground group-hover:text-foreground">
                Expanded
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleModeChange("collapsed")}
              className="flex items-center align-center px-2 py-2 hover:bg-accent focus:bg-accent cursor-pointer rounded-sm group transition-colors"
            >
              <div
                className={`w-3 h-3 rounded-full border border-border flex items-center justify-center ${sidebarMode === "collapsed" ? "border-emerald-500 bg-emerald-500/10" : "bg-transparent"}`}
              >
                {sidebarMode === "collapsed" && (
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                )}
              </div>
              <span className="text-xs font-medium text-foreground group-hover:text-foreground">
                Collapsed
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleModeChange("hover")}
              className="flex items-center align-center px-2 py-2 hover:bg-accent focus:bg-accent cursor-pointer rounded-sm group transition-colors"
            >
              <div
                className={`w-3 h-3 rounded-full border border-border flex items-center justify-center ${sidebarMode === "hover" ? "border-emerald-500 bg-emerald-500/10" : "bg-transparent"}`}
              >
                {sidebarMode === "hover" && (
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                )}
              </div>
              <span className="text-xs font-medium text-foreground group-hover:text-foreground">
                Expand on hover
              </span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
