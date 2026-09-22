import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  User,
  Settings,
  Sun,
  Moon,
  LogOut,
  Sparkles,
  Building,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
  useTheme,
} from "@k2net/ui";
import { useAuth } from "@k2net/auth/client";

export function TenantUserNav() {
  const { user, logout, isSuperAdmin } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const navigate = useNavigate();

  const handleLogout = async () => {
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
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : user?.username ? user.username.charAt(0).toUpperCase() : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/40 font-bold text-xs hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer select-none"
          title={user?.name || user?.username || "Profil Pengguna"}
        >
          {initial}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-lg p-1">
        <DropdownMenuLabel className="p-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-foreground truncate">
              {user?.name || user?.username || "Tenant Admin"}
            </span>
            {isSuperAdmin() && (
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[9px] font-mono">
                SUPER
              </Badge>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground font-mono truncate block">
            {user?.email || "admin@tenant.isp"}
          </span>
          <div className="flex items-center gap-1.5 pt-1 text-[10px] text-muted-foreground font-mono">
            <Building className="h-3 w-3 text-primary" />
            <span className="truncate">{user?.tenantSlug?.toUpperCase() || "ISP WORKSPACE"}</span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-border/60" />

        <DropdownMenuItem
          onClick={() => navigate({ to: "/settings" })}
          className="flex items-center gap-2 px-2 py-1.5 text-xs text-foreground hover:bg-muted/50 cursor-pointer rounded-md"
        >
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Pengaturan Domain</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex items-center gap-2 px-2 py-1.5 text-xs text-foreground hover:bg-muted/50 cursor-pointer rounded-md"
        >
          {isDark ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-primary" />}
          <span>Ganti Mode ({isDark ? "Light" : "Dark"})</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border/60" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 cursor-pointer rounded-md"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Keluar dari Akun</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
