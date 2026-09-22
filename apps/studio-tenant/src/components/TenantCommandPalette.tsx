import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map as MapIcon,
  Server,
  Users,
  AlertCircle,
  Settings,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  Plus,
  HelpCircle,
} from "lucide-react";
import {
  CommandPaletteRoot,
  CommandPaletteInput,
  CommandPaletteGroup,
  CommandPaletteItem,
  useTheme,
} from "@k2net/ui";
import { useAuth } from "@k2net/auth/client";

interface TenantCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenAi?: () => void;
  onOpenHelp?: () => void;
}

export function TenantCommandPalette({
  open,
  onOpenChange,
  onOpenAi,
  onOpenHelp,
}: TenantCommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const navigate = useNavigate();
  const { setTheme, resolvedTheme } = useTheme();
  const { logout } = useAuth();
  const isDark = resolvedTheme === "dark";

  // Global Keyboard listener for Cmd+K / Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleSelect = (action: () => void) => {
    action();
    onOpenChange(false);
    setQuery("");
  };

  const pages = [
    { label: "Dashboard Operasional", path: "/", icon: LayoutDashboard, badge: "Home" },
    { label: "Peta Spasial GIS (Web-QGIS)", path: "/map", icon: MapIcon, badge: "GIS" },
    { label: "Inventaris Jaringan (OLT & ODP)", path: "/inventory", icon: Server, badge: "Inventory" },
    { label: "Data Pelanggan & PPPoE", path: "/customers", icon: Users, badge: "Billing/ONU" },
    { label: "Monitoring Gangguan & Redaman", path: "/issues", icon: AlertCircle, badge: "Alerts" },
    { label: "Pengaturan Domain & Workspace", path: "/settings", icon: Settings, badge: "Config" },
  ];

  const filteredPages = pages.filter((p) =>
    p.label.toLowerCase().includes(query.toLowerCase()) ||
    p.badge.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <CommandPaletteRoot open={open} onOpenChange={onOpenChange}>
      <CommandPaletteInput
        value={query}
        onValueChange={setQuery}
        placeholder="Cari halaman, aksi teknis, atau utilitas..."
      />

      <div className="max-h-[360px] overflow-y-auto divide-y divide-border/40">
        {/* Navigation Group */}
        {filteredPages.length > 0 && (
          <CommandPaletteGroup heading="Halaman & Modul">
            {filteredPages.map((page) => {
              const Icon = page.icon;
              return (
                <CommandPaletteItem
                  key={page.path}
                  icon={Icon}
                  badgeText={page.badge}
                  onSelect={() => handleSelect(() => navigate({ to: page.path }))}
                >
                  {page.label}
                </CommandPaletteItem>
              );
            })}
          </CommandPaletteGroup>
        )}

        {/* Quick Actions Group */}
        <CommandPaletteGroup heading="Aksi Cepat & Utilitas">
          <CommandPaletteItem
            icon={Plus}
            badgeText="Action"
            onSelect={() => handleSelect(() => navigate({ to: "/customers" }))}
          >
            Registrasi Pelanggan Baru
          </CommandPaletteItem>

          <CommandPaletteItem
            icon={Sparkles}
            badgeText="Ctrl+J"
            onSelect={() => handleSelect(() => {
              if (onOpenAi) onOpenAi();
              else window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
            })}
          >
            Buka AI Network Copilot
          </CommandPaletteItem>

          <CommandPaletteItem
            icon={HelpCircle}
            badgeText="Help"
            onSelect={() => handleSelect(() => {
              if (onOpenHelp) onOpenHelp();
            })}
          >
            Buka Pusat Panduan & SOP FTTH
          </CommandPaletteItem>

          <CommandPaletteItem
            icon={isDark ? Sun : Moon}
            badgeText="Theme"
            onSelect={() => handleSelect(() => setTheme(isDark ? "light" : "dark"))}
          >
            Ganti Mode Tampilan ({isDark ? "Light Mode" : "Dark Mode"})
          </CommandPaletteItem>

          <CommandPaletteItem
            icon={LogOut}
            badgeText="Logout"
            onSelect={() => handleSelect(() => logout({ redirectUri: `${window.location.origin}/login` }))}
          >
            Keluar dari Sesi Portal
          </CommandPaletteItem>
        </CommandPaletteGroup>
      </div>
    </CommandPaletteRoot>
  );
}
