import * as React from "react";
import { Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
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
  Bell,
  Layers,
  ShieldAlert,
  Menu,
  BookOpen,
} from "lucide-react";
import {
  Button,
  Badge,
  Separator,
  ImpersonationBanner,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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

  const [sidebarMode, setSidebarMode] = React.useState<SidebarMode>("expanded");
  const [isHovering, setIsHovering] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Global Dialog & Drawer States
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);

  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Determine visual expansion of sidebar
  const isExpanded =
    sidebarMode === "expanded" || (sidebarMode === "hover" && isHovering);

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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
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

      {/* ── 2. Sidebar Navigation (Enterprise Standard) ──────────────────── */}
      <aside
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`fixed inset-y-0 left-0 z-40 flex flex-col justify-between border-r border-border/40 bg-sidebar transition-all duration-300 md:static ${
          isMobileOpen ? "w-64" : isExpanded ? "w-60" : "w-14"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Tenant Logo / Brand Header */}
          <div className="flex h-12 items-center justify-between border-b border-border/40 px-3 bg-sidebar shrink-0">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs font-bold text-xs">
                K2
              </div>
              {(isExpanded || isMobileOpen) && (
                <div className="flex flex-col truncate">
                  <span className="font-extrabold text-xs tracking-tight text-sidebar-foreground">
                    FTTH GIS PORTAL
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground truncate">
                    {user?.tenantSlug?.toUpperCase() || "ISP TENANT"}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsMobileOpen(false)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted/60 md:hidden cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Primary Navigation Links */}
          <nav className="space-y-1 p-2 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === "/" ? currentPath === "/" : currentPath.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-foreground font-semibold shadow-2xs"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  } ${!isExpanded && !isMobileOpen ? "justify-center px-0" : ""}`}
                  title={!isExpanded ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {(isExpanded || isMobileOpen) && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Utility & Workspace Settings */}
          <div className="border-t border-border/40 p-2 space-y-1 shrink-0">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-foreground font-semibold shadow-2xs"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  } ${!isExpanded && !isMobileOpen ? "justify-center px-0" : ""}`}
                  title={!isExpanded ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {(isExpanded || isMobileOpen) && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}

            <button
              onClick={() => setHelpOpen(true)}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full cursor-pointer ${
                !isExpanded && !isMobileOpen ? "justify-center px-0" : ""
              }`}
              title={!isExpanded ? "Pusat Panduan SOP" : undefined}
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              {(isExpanded || isMobileOpen) && <span className="truncate">Panduan & SOP</span>}
            </button>
          </div>

          {/* Bottom Sidebar Collapse Control (Supabase / Enterprise standard) */}
          <div className="border-t border-border/40 p-2 flex items-center justify-between shrink-0">
            <TenantSidebarControl
              mode={sidebarMode}
              onModeChange={setSidebarMode}
            />

            {(isExpanded || isMobileOpen) && (
              <span className="text-[10px] font-mono text-muted-foreground truncate">
                v2.6 Enterprise
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* ── 3. Main Content Container ────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {isImpersonating && (
          <ImpersonationBanner
            tenantName={impersonatedTenantName || user?.tenantSlug || "Tenant"}
            tenantSlug={impersonatedTenantSlug}
            remainingSeconds={remainingSeconds}
            onExit={exitSession}
            isExiting={isExiting}
          />
        )}

        {/* ── Top Bar Header (1:1 Parity with Enterprise Standard) ────────── */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 bg-background/95 px-3 sm:px-4 md:px-6 backdrop-blur-sm z-30 select-none">
          {/* Left: Mobile Toggle + Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 md:hidden cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
              <span className="font-bold text-foreground truncate">
                {user?.tenantSlug?.toUpperCase() || "ISP PORTAL"}
              </span>
              <span>›</span>
              <span className="font-semibold text-primary capitalize truncate">
                {currentPath === "/" ? "Dashboard" : currentPath.replace("/", "")}
              </span>
            </div>
          </div>

          {/* Right: Global Actions & Utilities */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* 1. Global Search / Command Palette (⌘K) */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center justify-between w-44 lg:w-52 h-7 px-2.5 text-xs rounded-md border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-muted-foreground shadow-xs cursor-pointer mr-1"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">Search or jump to...</span>
              </div>
              <kbd className="pointer-events-none inline-flex h-4.5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[9px] font-medium text-muted-foreground shrink-0">
                ⌘K
              </kbd>
            </button>

            {/* 2. Ask AI Copilot (Ctrl+J) */}
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="hidden md:flex items-center gap-1.5 h-7 px-2.5 text-xs rounded-md border border-border/80 bg-muted/30 hover:bg-muted/60 text-foreground font-medium transition-all shadow-xs cursor-pointer mr-1"
              title="K2NET AI Network Copilot (Ctrl+J)"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Ask AI</span>
              <kbd className="pointer-events-none hidden lg:inline-flex h-4 select-none items-center rounded border border-border bg-muted px-1 font-mono text-[9px] text-muted-foreground">
                Ctrl+J
              </kbd>
            </button>

            {/* 3. Quick Map GIS Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate({ to: "/map" })}
              className="hidden lg:flex h-7 px-2.5 text-xs border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 gap-1.5 font-medium cursor-pointer shadow-2xs rounded-md"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Buka Peta GIS</span>
            </Button>

            {/* 4. Help & Support Dialog (?) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHelpOpen(true)}
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              title="Pusat Bantuan & Panduan Teknis"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </Button>

            {/* 5. Notification Bell with Pulse */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotifOpen(true)}
              className="relative h-7 w-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              title="Notifikasi & Peringatan Telemetri"
            >
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            </Button>

            <Separator orientation="vertical" className="mx-0.5 h-4 bg-border/60" />

            {/* 6. User Avatar Navigation Dropdown */}
            <TenantUserNav />
          </div>
        </header>

        {/* Dynamic Nested Page Outlet */}
        <main className="flex-1 min-h-0 overflow-y-auto flex flex-col bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
