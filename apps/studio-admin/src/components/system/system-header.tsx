import * as React from "react";
import { Link, Image } from "@/lib/navigation-compat";
import { HelpCircle, MessageSquare, ShieldCheck, Search, Sparkles } from "lucide-react";
import {
  Button,
  Separator,
} from "@k2net/ui";
import { UserNav } from "../user-nav";
import { useCommandPalette } from "../command-palette/command-palette-provider";
import { getLogoUrl } from "@/lib/domain";
import { useSystemSettings } from "@/hooks/useSystemSettings";

export function SystemHeader() {
  const { settings = [] } = useSystemSettings();
  const { openCommandPalette } = useCommandPalette();

  const appName = settings.find((s) => s.key === "app_name")?.value || "System Admin";
  const logoUrl = settings.find((s) => s.key === "logo_url")?.value || "";

  return (
    <header className="flex h-12 shrink-0 w-full items-center justify-between border-groove-shell-b bg-background px-3 sm:px-4 z-40 py-2">
      {/* LEFT SECTION: Logo + Dynamic App Name + Breadcrumb */}
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
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

        <Separator orientation="vertical" className="mx-0.5 h-4 bg-border/40 shrink-0" />

        {/* Dynamic App Name (Visible across Desktop & Mobile) */}
        <span className="text-[11px] font-bold uppercase tracking-widest text-primary truncate max-w-[140px] sm:max-w-none shrink-0">
          {appName}
        </span>
      </div>

      {/* RIGHT SECTION: Desktop Tools + User Nav (On Mobile: Avatar ONLY) */}
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

        {/* Ask AI Copilot Button (Desktop only) */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
            }
          }}
          className="hidden md:flex items-center gap-1.5 h-7 px-2.5 text-xs rounded-md border border-border/80 bg-muted/30 hover:bg-muted/60 text-foreground font-medium transition-all shadow-xs cursor-pointer mr-1"
          title="K2NET AI Copilot (Ctrl+J)"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="hidden sm:inline">Ask AI</span>
          <kbd className="pointer-events-none hidden lg:inline-flex h-4 select-none items-center rounded border border-border bg-muted px-1 font-mono text-[9px] text-muted-foreground">
            Ctrl+J
          </kbd>
        </button>

        {/* Desktop Help & Feedback Buttons */}
        <div className="hidden md:flex items-center gap-0.5">
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

        <Separator orientation="vertical" className="hidden md:block mx-0.5 h-4 bg-border/60" />

        {/* User Profile Avatar Nav (Always displayed on Desktop & Mobile) */}
        <UserNav />
      </div>
    </header>
  );
}
