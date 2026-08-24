"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, MessageSquare, ShieldCheck, Menu, Search, Sparkles } from "lucide-react";
import { Button } from "@k2net/ui";
import { Separator } from "@k2net/ui";
import { Sheet, SheetContent, SheetTrigger } from "@k2net/ui";
import { UserNav } from "../user-nav";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS, checkIsActive } from "./admin-sidebar";
import { useCommandPalette } from "../command-palette/command-palette-provider";

import { getLogoUrl } from "@/lib/domain";

import Image from "next/image";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { getRouteHeaderTitle } from "@/lib/route-utils";

export function SystemHeader() {
  const pathname = usePathname();
  const { settings = [] } = useSystemSettings();
  const { openCommandPalette } = useCommandPalette();

  const appName = settings.find((s) => s.key === "app_name")?.value || "System Admin";
  const logoUrl = settings.find((s) => s.key === "logo_url")?.value || "";

  return (
    <header className="flex h-12 shrink-0 w-full items-center justify-between border-b border-border bg-background px-4 z-50 py-2">
      <div className="flex items-center gap-x-1">
        {/* Mobile Sidebar Menu */}
        <div className="flex md:hidden mr-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Menu className="h-4.5 w-4.5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] bg-sidebar border-r border-border p-0 dark text-foreground">
              <div className="flex flex-col h-full py-4 px-2">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40 mb-4 shrink-0">
                  <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">{appName}</span>
                </div>
                <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
                  {ADMIN_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = checkIsActive(item.href, pathname);
                    return (
                      <Link key={item.title} href={item.href}>
                        <div
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 h-10 cursor-pointer transition-all duration-200",
                            isActive
                              ? "text-primary bg-primary/10 hover:bg-primary/20"
                              : "text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="text-sm font-medium">{item.title}</span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <Link href="/overview" className="flex items-center cursor-pointer mr-1">
          <div className={logoUrl ? "flex h-5 w-5 items-center justify-center rounded overflow-hidden" : "flex h-5 w-5 items-center justify-center rounded bg-primary/10 border border-primary/30 group overflow-hidden"}>
            {logoUrl ? (
              <Image
                src={getLogoUrl(logoUrl)}
                width={20}
                height={20}
                className="h-5 w-5 object-contain"
                alt="Logo"
                unoptimized
              />
            ) : (
              <ShieldCheck className="h-3 w-3 text-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            )}
          </div>
        </Link>
        <Separator orientation="vertical" className="mx-0.5 h-4 bg-border/40" />
        
        <div className="flex items-center px-2 gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
            {appName}
          </span>
          <Separator orientation="vertical" className="mx-0.5 h-3 bg-border/40 -rotate-12" />
          <span className="text-[11px] font-medium text-muted-foreground">
            {getRouteHeaderTitle(pathname)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Global Command Palette Trigger Button (Fake Search Input on Right Header) */}
        <button
          onClick={() => openCommandPalette()}
          className="hidden md:flex items-center justify-between w-48 lg:w-56 px-3 py-1.5 text-xs rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-muted-foreground shadow-xs cursor-pointer mr-1"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">Search or jump to...</span>
          </div>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground shrink-0">
            ⌘K
          </kbd>
        </button>

        {/* Supabase-Style Top Header Ask AI Copilot Button */}
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-all shadow-xs cursor-pointer mr-1"
          title="K2NET AI Copilot (Ctrl+J)"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="hidden sm:inline">Ask AI</span>
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center rounded border border-primary/30 bg-primary/10 px-1 font-mono text-[9px] text-primary">
            Ctrl+J
          </kbd>
        </button>

        <div className="flex items-center gap-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="mx-1 h-4 bg-border" />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
