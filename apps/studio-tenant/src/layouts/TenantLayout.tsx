import { useState } from "react";
import { Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@k2net/auth/client";
import {
  LayoutDashboard,
  Map as MapIcon,
  Server,
  Users,
  AlertCircle,
  Settings,
  LogOut,
  Menu,
  Bell,
  Sun,
  Moon,
  Layers,
  ShieldAlert,
} from "lucide-react";
import {
  Button,
  Badge,
  ImpersonationBanner,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  useTheme,
} from "@k2net/ui";
import { useImpersonationSession } from "../lib/useImpersonationSession";

export function TenantLayout() {
  const { user, logout, isSuperAdmin } = useAuth();
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const navItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Peta Spasial GIS", path: "/map", icon: MapIcon },
    { label: "Inventaris Jaringan", path: "/inventory", icon: Server },
    { label: "Data Pelanggan", path: "/customers", icon: Users },
    { label: "Gangguan & Redaman", path: "/issues", icon: AlertCircle },
    { label: "Pengaturan Tenant", path: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col justify-between border-r border-border/40 bg-sidebar transition-all duration-300 md:static ${
          isSidebarOpen ? "w-64" : "w-18"
        }`}
      >
        <div className="flex flex-col">
          {/* Tenant Logo / Header */}
          <div className="flex h-12 items-center justify-between border-b border-border/40 px-3 bg-sidebar">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs font-bold text-xs">
                K2
              </div>
              {isSidebarOpen && (
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
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground md:flex cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === "/" ? currentPath === "/" : currentPath.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-foreground font-semibold shadow-2xs"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  } ${!isSidebarOpen ? "justify-center px-0" : ""}`}
                  title={!isSidebarOpen ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {isSidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Footer Actions */}
        <div className="border-t border-border/40 p-2.5 space-y-2">
          {isSidebarOpen && (
            <div className="flex items-center gap-2.5 rounded-lg bg-muted/40 p-2 text-xs">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex flex-col truncate">
                <span className="font-semibold text-foreground truncate text-xs">
                  {user?.name || user?.username}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono truncate">
                  {user?.email || "tenant-admin"}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleTheme}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Ganti Tema (Dark/Light)"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {isSuperAdmin() && isSidebarOpen && (
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[9px] font-mono">
                SUPER ADMIN
              </Badge>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                if (typeof window !== "undefined") {
                  const savedTheme = localStorage.getItem("k2net-theme");
                  localStorage.clear();
                  sessionStorage.clear();
                  if (savedTheme) {
                    localStorage.setItem("k2net-theme", savedTheme);
                  }
                }
                await logout({
                  redirectUri: `${window.location.origin}/login`,
                });
              }}
              className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1 cursor-pointer"
              title="Keluar dari Sistem"
            >
              <LogOut className="h-3.5 w-3.5" />
              {isSidebarOpen && <span>Keluar</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Modal Dialog: Sesi Bantuan Berakhir */}
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

        {/* Top Bar */}
        <header className="flex h-12 items-center justify-between border-b border-border/40 bg-background/95 px-4 md:px-6 backdrop-blur-sm shrink-0 select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 md:hidden cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Tenant ISP Portal</span>
              <span>›</span>
              <span className="font-semibold text-primary capitalize">
                {currentPath === "/" ? "Dashboard" : currentPath.replace("/", "")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate({ to: "/map" })}
              className="h-7 px-2.5 text-xs border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 gap-1.5 font-medium cursor-pointer shadow-2xs"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Buka Peta GIS</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="relative h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            </Button>
          </div>
        </header>

        {/* Dynamic Nested Page Content */}
        <main className="flex-1 min-h-0 overflow-y-auto flex flex-col bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
