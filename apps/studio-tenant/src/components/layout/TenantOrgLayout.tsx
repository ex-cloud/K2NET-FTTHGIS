import * as React from "react";
import { Outlet } from "@tanstack/react-router";
import { useAuth } from "@k2net/auth/client";
import { ShieldAlert, Sparkles, Search, HelpCircle, MessageSquare } from "lucide-react";
import {
  Button,
  Separator,
  ActionTooltip,
  ImpersonationBanner,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import { useImpersonationSession } from "../../lib/useImpersonationSession";
import { TenantCommandPalette } from "../TenantCommandPalette";
import { TenantAiAssistant } from "../TenantAiAssistant";
import { TenantHelpDialog } from "../TenantHelpDialog";
import { TenantNotificationsSheet } from "../TenantNotificationsSheet";
import { TenantUserNav } from "../TenantUserNav";
import { TenantOrgBrand } from "../system/TenantOrgBrand";
import { TenantTierBadge } from "../system/TenantTierBadge";
import { TenantOrgSidebar } from "./TenantOrgSidebar";
import { TenantSecondarySidebar } from "./TenantSecondarySidebar";
import { TenantMobileFloatingDock } from "../system/TenantMobileFloatingDock";
import { SidebarModeProvider } from "../sidebar-mode-context";

function TenantOrgLayoutContent() {
  const { user } = useAuth();
  const {
    isImpersonating,
    tenantName: impersonatedTenantName,
    tenantSlug: impersonatedTenantSlug,
    remainingSeconds,
    isExiting,
    exitSession,
    isSessionEnded,
    endedTenantName,
  } = useImpersonationSession();

  // Global Dialog & Drawer States
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden font-sans text-foreground">
      {/* ── 1. Global Dialogs & Drawers ──────────────────────────────────── */}
      <TenantCommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onOpenAi={() => setAiOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <TenantAiAssistant open={aiOpen} onOpenChange={setAiOpen} />
      <TenantHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
      <TenantNotificationsSheet open={notifOpen} onOpenChange={setNotifOpen} />

      {/* Modal Dialog: Sesi Impersonasi Berakhir */}
      <Dialog open={isSessionEnded}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <DialogHeader className="flex flex-col items-center gap-2 text-center pt-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Sesi Bantuan Telah Berakhir
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Sesi impersonasi untuk tenant{" "}
              <strong className="text-foreground">{endedTenantName || "ISP Tenant"}</strong>{" "}
              telah ditutup oleh administrator dari portal utama atau batas waktu operasional telah habis.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                sessionStorage.removeItem("k2net_session_ended");
                window.close();
                setTimeout(() => {
                  window.location.href = "/login";
                }, 300);
              }}
              className="w-full text-xs"
            >
              Tutup Tab Ini
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                sessionStorage.removeItem("k2net_session_ended");
                window.location.href = "https://system-gis.kdua.net/organizations";
              }}
              className="w-full text-xs h-8 rounded-md font-medium"
            >
              Kembali ke Portal Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isImpersonating && (
        <ImpersonationBanner
          tenantName={impersonatedTenantName || user?.tenantSlug || "Tenant"}
          tenantSlug={impersonatedTenantSlug}
          remainingSeconds={remainingSeconds}
          onExit={exitSession}
          isExiting={isExiting}
        />
      )}

      {/* ── 2. Top Header (Organization Scope) ─────────────────────────────── */}
      <header className="flex h-12 shrink-0 w-full items-center justify-between border-b border-border/40 bg-background px-3 sm:px-4 z-40 py-2 select-none">
        {/* LEFT SECTION: Logo + Org Brand + Tier Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <TenantOrgBrand href="/projects" showSeparator={true} />
          <TenantTierBadge />
        </div>

        {/* RIGHT SECTION: Tools + UserNav */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Desktop Search / Command Palette Trigger (⌘K) */}
          <ActionTooltip label="Cari perintah..." shortcut="⌘K" side="bottom">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden md:flex items-center justify-between w-48 h-7 px-2.5 text-xs rounded-md border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-muted-foreground shadow-xs cursor-pointer mr-1"
            >
              <div className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">Cari perintah...</span>
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
              onClick={() => setAiOpen(true)}
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
                onClick={() => setHelpOpen(true)}
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
                onClick={() => setNotifOpen(true)}
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Notifikasi & Alerts"
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
            </ActionTooltip>
          </div>

          <Separator orientation="vertical" className="hidden md:block mx-0.5 h-4 bg-border/60" />
          <TenantUserNav />
        </div>
      </header>

      {/* ── 3. Main Workspace Area (Primary Sidebar + Secondary Sidebar + Content) ─ */}
      <div className="flex flex-1 overflow-hidden relative">
        <TenantOrgSidebar />

        {/* Secondary Modular Sidebar (shown dynamically for /team/*, /settings/*) */}
        <TenantSecondarySidebar />

        {/* Dynamic Nested Page Outlet */}
        <div className="flex-1 flex min-w-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0 w-0 overflow-hidden relative">
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 bg-background">
              <Outlet />
            </main>
          </div>
        </div>
      </div>

      {/* ── 4. Mobile Floating Command Dock ───────────────────────────────── */}
      <TenantMobileFloatingDock
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenAi={() => setAiOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        onOpenNotif={() => setNotifOpen(true)}
      />
    </div>
  );
}

export function TenantOrgLayout() {
  return (
    <SidebarModeProvider>
      <TenantOrgLayoutContent />
    </SidebarModeProvider>
  );
}
