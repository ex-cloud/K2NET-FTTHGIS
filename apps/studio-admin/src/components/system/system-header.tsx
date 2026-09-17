

import * as React from "react";
import { Link, usePathname, Image } from "@/lib/navigation-compat";
import { HelpCircle, MessageSquare, ShieldCheck, Menu, Search, Sparkles } from "lucide-react";
import {
  Button,
  Separator,
} from "@k2net/ui";
import { UserNav } from "../user-nav";
import { useCommandPalette } from "../command-palette/command-palette-provider";
import { getLogoUrl } from "@/lib/domain";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { getRouteBreadcrumbs } from "@/lib/route-utils";
import { MobileNavigationSheet } from "./mobile-navigation-sheet";

export function SystemHeader() {
  const pathname = usePathname();
  const { settings = [] } = useSystemSettings();
  const { openCommandPalette } = useCommandPalette();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const appName = settings.find((s) => s.key === "app_name")?.value || "System Admin";
  const logoUrl = settings.find((s) => s.key === "logo_url")?.value || "";
  const breadcrumbs = getRouteBreadcrumbs(pathname);

  return (
    <>
      <header className="flex h-12 shrink-0 w-full items-center justify-between border-b border-border bg-background px-3 sm:px-4 z-40 py-2">
        {/* LEFT SECTION: Logo + Dynamic Breadcrumb */}
        <div className="flex items-center gap-1.5 min-w-0">
          <Link href="/overview" className="flex items-center cursor-pointer shrink-0" title={`${appName} Overview`}>
            <div className={logoUrl ? "flex size-6 items-center justify-center rounded overflow-hidden" : "flex size-6 items-center justify-center rounded bg-primary/10 border border-primary/30 group overflow-hidden"}>
              {logoUrl ? (
                <Image
                  src={getLogoUrl(logoUrl)}
                  width={22}
                  height={22}
                  className="size-5.5 object-contain"
                  alt="Logo"
                  unoptimized
                />
              ) : (
                <ShieldCheck className="size-3.5 text-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              )}
            </div>
          </Link>

          {/* Dynamic Breadcrumbs */}
          <div className="flex items-center gap-1.5 min-w-0 text-xs">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.label + idx}>
                  <span className="text-muted-foreground/50 font-mono select-none">/</span>
                  {isLast ? (
                    <span className="font-semibold text-foreground tracking-tight truncate max-w-[140px] sm:max-w-[220px] md:max-w-none">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href || "#"}
                      className="text-muted-foreground hover:text-foreground transition-colors truncate hidden xs:inline max-w-[100px] sm:max-w-none"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* RIGHT SECTION: Desktop Tools + User Nav + Mobile Hamburger */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Desktop Search / Command Palette Trigger */}
          <button
            type="button"
            onClick={() => openCommandPalette()}
            className="hidden md:flex items-center justify-between w-48 lg:w-56 h-7 px-2.5 text-xs rounded-md border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-muted-foreground shadow-xs cursor-pointer mr-1"
          >
            <div className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">Search or jump to...</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-4.5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[9px] font-medium text-muted-foreground shrink-0">
              ⌘K
            </kbd>
          </button>

          {/* Ask AI Copilot Button (Desktop + Mobile Icon Button) */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
              }
            }}
            className="flex items-center gap-1.5 h-7 px-2 sm:px-2.5 text-xs rounded-md border border-border/80 bg-muted/30 hover:bg-muted/60 text-foreground font-medium transition-all shadow-xs cursor-pointer"
            title="K2NET AI Copilot (Ctrl+J)"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="hidden sm:inline">Ask AI</span>
            <kbd className="pointer-events-none hidden lg:inline-flex h-4 select-none items-center rounded border border-border bg-muted px-1 font-mono text-[9px] text-muted-foreground">
              Ctrl+J
            </kbd>
          </button>

          {/* Desktop Help & Feedback Buttons */}
          <div className="hidden sm:flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
              title="Help & Support"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
              title="System Messages"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Separator orientation="vertical" className="hidden sm:block mx-0.5 h-4 bg-border/60" />

          {/* User Profile Avatar Nav */}
          <UserNav />

          {/* Mobile Hamburger Menu Trigger (Right side, next to Avatar) */}
          <div className="flex md:hidden ml-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Hierarchical Navigation Sheet */}
      <MobileNavigationSheet
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
      />
    </>
  );
}
