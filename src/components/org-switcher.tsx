"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function OrgSwitcher() {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="flex items-center justify-center p-0 h-10 w-10 hover:bg-accent data-[state=open]:bg-accent transition-colors rounded-lg border border-border/50"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-lg shadow-sm">
                <span>E</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg bg-popover border-border shadow-xl"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={10}
          >
            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">
              Organizations
            </DropdownMenuLabel>
            <DropdownMenuItem className="gap-2 p-3 hover:bg-accent focus:bg-accent cursor-pointer">
              <div className="flex size-7 items-center justify-center rounded-md border border-border bg-muted/50">
                <span className="font-bold text-xs">E</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">ex-cloud&apos;s Org</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                  Free Plan
                </span>
              </div>
              <DropdownMenuShortcut className="text-muted-foreground/50">
                ⌘1
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 p-3 hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer">
              <div className="flex size-7 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900">
                <span className="font-bold text-xs">T</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Telkom Jabar</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                  Enterprise
                </span>
              </div>
              <DropdownMenuShortcut className="text-muted-foreground/50">
                ⌘2
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="gap-2 p-3 hover:bg-accent focus:bg-accent cursor-pointer">
              <div className="flex size-7 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-sm text-muted-foreground">
                New Organization
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
