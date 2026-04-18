"use client";

import React from "react";
import { Bell, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PollerHealthBadge } from "./poller-health-badge";
import { GlobalSearch } from "./global-search";

export function TopHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 h-16 flex shrink-0 items-center justify-between px-6 border-b border-zinc-200/40 dark:border-zinc-800/30 bg-white/20 dark:bg-zinc-950/20 backdrop-blur-2xl z-30 transition-all duration-500">
      {/* Floating Sidebar Trigger precisely on the border line */}
      <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 z-100 pointer-events-auto">
        <SidebarTrigger className="bg-white/90 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white shadow-xl rounded-full size-8 flex items-center justify-center hover:scale-110 transition-all active:scale-95" />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col ml-12">
          <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight leading-none">
            Executive Dashboard
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500/80 uppercase tracking-widest">
              Live Operations
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-xl px-12">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white dark:border-zinc-950"></span>
        </Button>

        <PollerHealthBadge />
        <ModeToggle />

        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

        <Button className="bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-white dark:text-emerald-500 border-none dark:border-emerald-500/20 gap-2 h-9 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all">
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
      </div>
    </header>
  );
}
