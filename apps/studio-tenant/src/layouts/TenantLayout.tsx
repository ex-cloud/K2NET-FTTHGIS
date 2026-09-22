import * as React from "react";
import { Outlet, Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@k2net/auth/client";
import {
  LayoutDashboard,
  Map as MapIcon,
  Server,
  Users,
  AlertCircle,
  Settings,
  Search,
  Sparkles,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  BookOpen,
} from "lucide-react";
import {
  Button,
  Separator,
  ImpersonationBanner,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@k2net/ui";
import { useImpersonationSession } from "../lib/useImpersonationSession";
import { TenantCommandPalette } from "../components/TenantCommandPalette";
import { TenantAiAssistant } from "../components/TenantAiAssistant";
import { TenantHelpDialog } from "../components/TenantHelpDialog";
import { TenantNotificationsSheet } from "../components/TenantNotificationsSheet";
import { TenantUserNav } from "../components/TenantUserNav";
import { TenantSidebarControl, type SidebarMode } from "../components/TenantSidebarControl";

export function TenantLayout() {
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

  const [sidebarMode, setSidebarMode] = React.useState<SidebarMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tenant-sidebar-mode") as SidebarMode;
      if (saved === "expanded" || saved === "collapsed" || saved === "hover") {
        return saved;
      }
    }
    return "expanded";
  });
  const [isHovering, setIsHovering] = React.useState(false);

  // Global Dialog & Drawer States
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);

  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Determine visual expansion of sidebar
  const isExpanded =
    sidebarMode === "expanded" || (sidebarMode === "hover" && isHovering);

  const isFloating = sidebarMode === "hover";

  const appName = user?.tenantSlug
    ? `FTTH GIS ${user.tenantSlug.toUpperCase()}`
    : "FTTH GIS PORTAL";

  const navItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Peta Spasial GIS", path: "/map", icon: MapIcon },
    { label: "Inventaris Jaringan", path: "/inventory", icon: Server },
    { label: "Data Pelanggan", path: "/customers", icon: Users },
    { label: "Gangguan & Redaman", path: "/issues", icon: AlertCircle },
  ];

  const bottomNavItems = [
    { label: "Pengaturan Tenant", path: "/settings", icon: Settings },
  ];

  const renderNavButton = (item: { label: string; path: string; icon: React.ElementType }) => {
    const Icon = item.icon;
    const isActive = item.path === "/" ? currentPath === "/" : currentPath.startsWith(item.path);

    const button = (
      <div
        className={cn(
          "flex items-center rounded-lg h-8 cursor-pointer justify-start w-full pl-[9px] pr-2.5 transition-colors duration-200 group relative",
          isActive
            ? "text-sidebar-foreground bg-sidebar-accent"
            : "text-sidebar-foreground/90 dark:text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        )}
      >
        <div className="relative flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <span
          className={cn(
            "text-sm whitespace-nowrap transition-all duration-300 flex-1",
            isActive ? "font-semibold text-sidebar-foreground" : "font-medium",
            isExpanded ? "opacity-100 w-auto ml-3" : "opacity-0 w-0 overflow-hidden ml-0"
          )}
        >
          {item.label}
        </span>
      </div>
    );

    const wrapped = (
      <Link key={item.path} to={item.path}>
        {button}
      </Link>
    );

    if (!isExpanded) {
      return (
        <Tooltip key={item.path}>
          <TooltipTrigger asChild>{wrapped}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <React.Fragment key={item.path}>{wrapped}</React.Fragment>;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden font-sans text-foreground">
      {/* ── 1. Global Dialogs & Drawers ──────────────────────────────────── */}
      <TenantCommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onOpenAi={() => setAiOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <TenantAiAssistant
        open={aiOpen}
        onOpenChange={setAiOpen}
      />

      <TenantHelpDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
      />

      <TenantNotificationsSheet
        open={notifOpen}
        onOpenChange={setNotifOpen}
      />

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
              Seluruh hak akses operasional sementara telah dicabut demi keamanan.
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

      {/* ── 2. Top Header (Full-Width 100% Horizontal) ────────────────────── */}
      <header className="flex h-12 shrink-0 w-full items-center justify-between border-b border-border/40 bg-background px-3 sm:px-4 z-40 py-2 select-none">
        {/* LEFT SECTION: Logo + Dynamic App Name */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <Link to="/" className="flex items-center cursor-pointer shrink-0" title={`${appName} Dashboard`}>
            <div className="flex size-6 items-center justify-center rounded bg-primary/10 border border-primary/30 group overflow-hidden">
              <ShieldCheck className="size-3.5 text-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>
          </Link>

          <Separator orientation="vertical" className="mx-0.5 h-4 bg-border/40 shrink-0" />

          {/* Dynamic App Name (Visible across Desktop & Mobile) */}
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary truncate max-w-[140px] sm:max-w-none shrink-0">
            {appName}
          </span>
        </div>

        {/* RIGHT SECTION: Desktop Tools + User Nav */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Desktop Search / Command Palette Trigger (⌘K) */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
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

          {/* Ask AI Copilot Button (Ctrl+J) */}
          <button
            type="button"
            onClick={() => setAiOpen(true)}
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
              onClick={() => setHelpOpen(true)}
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              title="Help & Support"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotifOpen(true)}
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              title="System Messages & Alerts"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Separator orientation="vertical" className="hidden md:block mx-0.5 h-4 bg-border/60" />

          {/* User Profile Avatar Nav */}
          <TenantUserNav />
        </div>
      </header>

      {/* ── 3. Main Workspace Area (Sidebar + Content) ─────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Floating Spacer */}
        {isFloating && (
          <div className="hidden md:block w-[50px] shrink-0 h-full" />
        )}

        {/* Sidebar */}
        <aside
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          style={isFloating ? {
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 50,
            boxShadow: "none",
          } : undefined}
          className={`hidden md:flex border-r border-border/40 flex-col bg-sidebar shrink-0 h-full transition-all duration-300 ease-in-out overflow-hidden ${
            isFloating ? "" : "z-50"
          } ${isExpanded ? "w-[200px]" : "w-[50px]"}`}
        >
          <div className="flex flex-col h-full py-4">
            <TooltipProvider delayDuration={0}>
              {/* Primary Navigation */}
              <nav className="flex flex-col gap-1 px-2">
                {navItems.map(renderNavButton)}
              </nav>

              {/* Dynamic Spacer */}
              <div className="flex-1" />

              {/* Bottom Utility Items */}
              <nav className="flex flex-col gap-1 px-2 border-groove-t pt-2.5 mb-2">
                {bottomNavItems.map(renderNavButton)}

                {/* SOP Guide link */}
                {(() => {
                  const button = (
                    <div
                      onClick={() => setHelpOpen(true)}
                      className="flex items-center rounded-lg h-8 cursor-pointer justify-start w-full pl-[9px] pr-2.5 transition-colors duration-200 group relative text-sidebar-foreground/90 dark:text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent font-medium"
                    >
                      <div className="relative flex items-center justify-center shrink-0">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <span
                        className={cn(
                          "text-sm whitespace-nowrap transition-all duration-300 flex-1 ml-3 font-medium",
                          isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden ml-0"
                        )}
                      >
                        Panduan & SOP
                      </span>
                    </div>
                  );

                  if (!isExpanded) {
                    return (
                      <Tooltip key="sop-help">
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          Panduan & SOP
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  return <React.Fragment key="sop-help">{button}</React.Fragment>;
                })()}
              </nav>
            </TooltipProvider>

            {/* Bottom Sidebar Expand/Collapse Control */}
            <div className="flex flex-col gap-2 px-2">
              <div className="flex items-center rounded-lg h-8 w-full pl-[5px] pr-2.5 justify-start">
                <TenantSidebarControl
                  sidebarMode={sidebarMode}
                  setSidebarMode={setSidebarMode}
                  isExpanded={isExpanded}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Dynamic Nested Page Outlet */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
