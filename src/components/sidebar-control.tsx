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
    <div className="flex items-center px-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all duration-200 rounded-md"
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
          className="w-48 bg-zinc-950 border-white/10 shadow-2xl p-1 animate-in fade-in zoom-in duration-200"
          sideOffset={10}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-2 text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
              Display Mode
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              onClick={() => handleModeChange("expanded")}
              className="flex items-center gap-3 px-2 py-2.5 focus:bg-emerald-500/10 cursor-pointer rounded-sm group transition-colors"
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${sidebarMode === "expanded" ? "border-emerald-500 bg-emerald-500/20" : "border-zinc-800 bg-transparent"}`}
              >
                {sidebarMode === "expanded" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
              </div>
              <span className={`text-xs font-semibold ${sidebarMode === "expanded" ? "text-emerald-500" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                Expanded
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleModeChange("collapsed")}
              className="flex items-center gap-3 px-2 py-2.5 focus:bg-emerald-500/10 cursor-pointer rounded-sm group transition-colors"
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${sidebarMode === "collapsed" ? "border-emerald-500 bg-emerald-500/20" : "border-zinc-800 bg-transparent"}`}
              >
                {sidebarMode === "collapsed" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
              </div>
              <span className={`text-xs font-semibold ${sidebarMode === "collapsed" ? "text-emerald-500" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                Collapsed
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleModeChange("hover")}
              className="flex items-center gap-3 px-2 py-2.5 focus:bg-emerald-500/10 cursor-pointer rounded-sm group transition-colors"
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${sidebarMode === "hover" ? "border-emerald-500 bg-emerald-500/20" : "border-zinc-800 bg-transparent"}`}
              >
                {sidebarMode === "hover" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className={`text-xs font-semibold ${sidebarMode === "hover" ? "text-emerald-500" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                  Expand on Hover
                </span>
                <span className="text-[9px] text-zinc-600 font-medium">Reveals on mouse enter</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
