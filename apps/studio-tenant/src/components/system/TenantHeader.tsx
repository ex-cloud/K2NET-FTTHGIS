import * as React from "react";
import { HelpCircle, MessageSquare, Search, Sparkles } from "lucide-react";
import { Button, Separator, ActionTooltip, cn } from "@k2net/ui";
import { useImpersonationSession } from "../../lib/useImpersonationSession";
import { TenantUserNav } from "../TenantUserNav";
import { TenantOrgBrand } from "./TenantOrgBrand";
import { TenantTierBadge } from "./TenantTierBadge";

interface TenantHeaderProps {
  onOpenCommandPalette: () => void;
  onOpenAi: () => void;
  onOpenHelp: () => void;
  onOpenNotif: () => void;
}

export function TenantHeader({
  onOpenCommandPalette,
  onOpenAi,
  onOpenHelp,
  onOpenNotif,
}: TenantHeaderProps) {
  const { isImpersonating } = useImpersonationSession();

  return (
    <header className={cn(
      "flex h-12 shrink-0 w-full items-center justify-between border-b px-3 sm:px-4 z-40 py-2 select-none transition-colors",
      isImpersonating
        ? "border-amber-500/30 bg-amber-500/[0.02]"
        : "border-border/40 bg-background"
    )}>
      {/* LEFT SECTION: Logo + Org Brand + Tier Badge */}
      <div className="flex items-center gap-2 min-w-0">
        <TenantOrgBrand href="/projects" showSeparator={true} />
        <TenantTierBadge />
      </div>

      {/* RIGHT SECTION: Desktop Tools + User Nav */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Desktop Search / Command Palette Trigger (⌘K) */}
        <ActionTooltip label="Search or jump to..." shortcut="⌘K" side="bottom">
          <button
            type="button"
            onClick={onOpenCommandPalette}
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
        </ActionTooltip>

        {/* Ask AI Copilot Button (Icon-only with interactive tooltip) */}
        <ActionTooltip label="Ask AI Copilot" shortcut="Ctrl+J" side="bottom">
          <button
            type="button"
            onClick={onOpenAi}
            className="hidden md:flex items-center justify-center h-7 w-7 rounded-md border border-border/80 bg-muted/30 hover:bg-muted/60 text-primary hover:text-primary transition-all shadow-xs cursor-pointer mr-0.5"
            aria-label="Ask AI Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
          </button>
        </ActionTooltip>

        {/* Desktop Help & Feedback Buttons */}
        <div className="hidden md:flex items-center gap-0.5">
          <ActionTooltip label="Help & Support" shortcut="?" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenHelp}
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Help & Support"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </Button>
          </ActionTooltip>
          <ActionTooltip label="Notifikasi & Alerts" shortcut="M" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenNotif}
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Notifikasi & Alerts"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
          </ActionTooltip>
        </div>

        <Separator orientation="vertical" className="hidden md:block mx-0.5 h-4 bg-border/60" />

        {/* User Profile Avatar Nav */}
        <TenantUserNav />
      </div>
    </header>
  );
}
