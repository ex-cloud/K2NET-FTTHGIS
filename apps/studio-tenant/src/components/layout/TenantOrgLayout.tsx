import * as React from "react";
import { Outlet } from "@tanstack/react-router";
import { useAuth } from "@k2net/auth/client";
import { ShieldAlert } from "lucide-react";
import {
  Button,
  ImpersonationBanner,
  AppHeaderShell,
  AppHeaderActions,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  SidebarModeProvider,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { useImpersonationSession } from "../../lib/useImpersonationSession";
import { TenantCommandPalette } from "../TenantCommandPalette";
import { TenantAiAssistant } from "../TenantAiAssistant";
import { TenantHelpDialog } from "../TenantHelpDialog";
import { TenantNotificationsSheet } from "../TenantNotificationsSheet";
import { TenantUserNav } from "../TenantUserNav";
import { TenantLogo, TenantOrgName } from "../system/TenantOrgBrand";
import { TenantTierBadge } from "../system/TenantTierBadge";
import { TenantOrgSidebar } from "./TenantOrgSidebar";
import { TenantSecondarySidebar } from "./TenantSecondarySidebar";
import { TenantMobileFloatingDock } from "../system/TenantMobileFloatingDock";
import { TrialPausedBanner } from "../system/TrialPausedBanner";

function TenantOrgLayoutContent() {
  const { t } = useTranslation();
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
              {t("common.close_tab")}
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
              {t("common.back_to_admin")}
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
      <AppHeaderShell
        isImpersonating={isImpersonating}
        leftSection={
          <>
            <TenantLogo href="/projects" />
            <span
              className="hidden sm:inline-flex items-center justify-center text-muted-foreground/30 font-mono text-xs sm:text-sm select-none shrink-0 w-3"
              aria-hidden="true"
            >
              /
            </span>
            <TenantOrgName href="/projects" />
            <TenantTierBadge />
          </>
        }
        rightSection={
          <AppHeaderActions
            onOpenSearch={() => setCommandPaletteOpen(true)}
            searchLabel={t("common.search_commands")}
            searchShortcut="⌘K"
            searchWidthClass="w-48"
            onOpenAi={() => setAiOpen(true)}
            aiLabel={t("common.ask_ai_copilot")}
            aiShortcut="Ctrl+J"
            onOpenHelp={() => setHelpOpen(true)}
            helpLabel={t("common.help_support")}
            helpShortcut="?"
            onOpenNotifications={() => setNotifOpen(true)}
            notificationsLabel={t("common.notifications")}
            notificationsShortcut="M"
            userNavSlot={<TenantUserNav />}
          />
        }
      />

      {/* ── 2.5 Trial Lifecycle & Grace Period Paused Alert Banner ───────── */}
      <TrialPausedBanner />

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
    <SidebarModeProvider storageKey="tenant-sidebar-mode">
      <TenantOrgLayoutContent />
    </SidebarModeProvider>
  );
}
