"use client";

import * as React from "react";
import {
  Settings,
  LayoutGrid,
  Users,
  Plug,
  BarChart3,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSidebarMode } from "./sidebar-mode-context";
import { SidebarControl } from "./sidebar-control";
export function MainSidebar() {
  const params = useParams();
  const orgId = params.orgId || "default";
  const { setOpen, sidebarMode } = useSidebarMode();

  const handleMouseEnter = () => {
    if (sidebarMode === "hover") {
      setOpen(true);
    }
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      className="w-[50px] border-r border-sidebar-border flex flex-col items-center py-4 bg-sidebar z-30 shrink-0 h-[calc(100vh-48px)]"
    >
      <div className="flex flex-col items-center gap-4 w-full h-full">
        <TooltipProvider delayDuration={0}>
          <div className="flex flex-col items-center gap-4 w-full">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/org/${orgId}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-emerald-500 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20"
                  >
                    <LayoutGrid className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Projects</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/org/${orgId}/team`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg"
                  >
                    <Users className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Team</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg"
                >
                  <Plug className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Integrations</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg"
                >
                  <BarChart3 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Usage</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg"
                >
                  <CreditCard className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Billing</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        <div className="flex-1" />

        <div className="flex flex-col items-center gap-4">
          <SidebarControl />

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Account Settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-8 w-8 rounded-full bg-sidebar-accent/50 flex items-center justify-center text-[10px] font-bold text-sidebar-foreground/70 border border-sidebar-border shadow-sm mb-2">
            JD
          </div>
        </div>
      </div>
    </aside>
  );
}
