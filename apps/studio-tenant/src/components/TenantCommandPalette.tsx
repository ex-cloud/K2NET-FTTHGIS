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
  FolderKanban,
  CreditCard,
  UserCheck,
} from "lucide-react";
import {
  CommandPaletteRoot,
  CommandPaletteInput,
  CommandPaletteGroup,
  CommandPaletteItem,
  useTheme,
} from "@k2net/ui";
import { useAuth } from "@k2net/auth/client";

export interface TenantCommandPaletteContentProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSelectAction: (action: () => void) => void;
  onOpenAi?: () => void;
  onOpenHelp?: () => void;
  projectId?: string;
  className?: string;
}

export function TenantCommandPaletteContent({
  query,
  onQueryChange,
  onSelectAction,
  onOpenAi,
  onOpenHelp,
  projectId,
  className,
}: TenantCommandPaletteContentProps) {
  const navigate = useNavigate();
  const { setTheme, resolvedTheme } = useTheme();
  const { logout } = useAuth();
  const isDark = resolvedTheme === "dark";

  const resolvedProjectId = projectId || "proj-bdg-01";

  const pages = React.useMemo(() => {
    return [
      {
        id: "nav-dash",
        label: "Dashboard Operasional",
        path: `/project/${resolvedProjectId}/dashboard`,
        icon: LayoutDashboard,
        badge: "Home",
      },
      {
        id: "nav-gis",
        label: "Peta Spasial GIS (Web-QGIS)",
        path: `/project/${resolvedProjectId}/gis/topology`,
        icon: MapIcon,
        badge: "GIS",
      },
      {
        id: "nav-inv",
        label: "Inventaris Jaringan (OLT & ODP)",
        path: `/project/${resolvedProjectId}/core/olt`,
        icon: Server,
        badge: "Inventory",
      },
      {
        id: "nav-cust",
        label: "Data Pelanggan & PPPoE",
        path: `/project/${resolvedProjectId}/subscribers/list`,
        icon: Users,
        badge: "ONU/PPPoE",
      },
      {
        id: "nav-issues",
        label: "Monitoring Gangguan & Redaman",
        path: `/project/${resolvedProjectId}/issues/tickets`,
        icon: AlertCircle,
        badge: "Alerts",
      },
      {
        id: "nav-org-projects",
        label: "Daftar Semua Proyek Workspace",
        path: "/projects",
        icon: FolderKanban,
        badge: "Projects",
      },
      {
        id: "nav-org-billing",
        label: "Tagihan & Paket Langganan",
        path: "/billing",
        icon: CreditCard,
        badge: "Billing",
      },
      {
        id: "nav-org-members",
        label: "Manajemen Anggota & Akses",
        path: "/members",
        icon: UserCheck,
        badge: "IAM",
      },
      {
        id: "nav-settings",
        label: "Pengaturan Domain & Workspace",
        path: "/settings",
        icon: Settings,
        badge: "Config",
      },
    ];
  }, [resolvedProjectId]);

  const filteredPages = React.useMemo(() => {
    if (!query.trim()) return pages.slice(0, 6);
    const q = query.toLowerCase();
    return pages.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.badge.toLowerCase().includes(q)
    );
  }, [query, pages]);

  return (
    <div className={`flex flex-col flex-1 overflow-hidden ${className || ""}`}>
      <CommandPaletteInput
        value={query}
        onValueChange={onQueryChange}
        placeholder="Cari halaman, aksi teknis, atau utilitas..."
      />

      <div className="flex-1 overflow-y-auto p-1 divide-y divide-border/40">
        {/* Navigation Group */}
        {filteredPages.length > 0 && (
          <CommandPaletteGroup heading="Halaman & Modul">
            {filteredPages.map((page) => {
              const Icon = page.icon;
              return (
                <CommandPaletteItem
                  key={page.id}
                  icon={Icon}
                  badgeText={page.badge}
                  onSelect={() => onSelectAction(() => navigate({ to: page.path as never }))}
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
            onSelect={() =>
              onSelectAction(() =>
                navigate({ to: `/project/${resolvedProjectId}/subscribers/list` as never })
              )
            }
          >
            Registrasi Pelanggan Baru
          </CommandPaletteItem>

          <CommandPaletteItem
            icon={Sparkles}
            badgeText="Ctrl+J"
            onSelect={() =>
              onSelectAction(() => {
                if (onOpenAi) onOpenAi();
                else window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
              })
            }
          >
            Buka AI Network Copilot
          </CommandPaletteItem>

          <CommandPaletteItem
            icon={HelpCircle}
            badgeText="Help"
            onSelect={() =>
              onSelectAction(() => {
                if (onOpenHelp) onOpenHelp();
              })
            }
          >
            Buka Pusat Panduan &amp; SOP FTTH
          </CommandPaletteItem>

          <CommandPaletteItem
            icon={isDark ? Sun : Moon}
            badgeText="Theme"
            onSelect={() => onSelectAction(() => setTheme(isDark ? "light" : "dark"))}
          >
            Ganti Mode Tampilan ({isDark ? "Light Mode" : "Dark Mode"})
          </CommandPaletteItem>

          <CommandPaletteItem
            icon={LogOut}
            badgeText="Logout"
            onSelect={() =>
              onSelectAction(() =>
                logout({ redirectUri: `${window.location.origin}/login` })
              )
            }
          >
            Keluar dari Sesi Portal
          </CommandPaletteItem>
        </CommandPaletteGroup>

        {filteredPages.length === 0 && query.trim() !== "" && (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Tidak ada hasil untuk &quot;<span className="font-semibold text-foreground">{query}</span>&quot;
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border/80 px-4 py-2 bg-muted/20 text-[10px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-3">
          <span>
            <kbd className="font-mono bg-muted px-1 py-0.5 rounded border border-border">↑↓</kbd> Select
          </span>
          <span>
            <kbd className="font-mono bg-muted px-1 py-0.5 rounded border border-border">↵</kbd> Open
          </span>
        </div>
        <span>K2NET Enterprise Tenant</span>
      </div>
    </div>
  );
}

interface TenantCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenAi?: () => void;
  onOpenHelp?: () => void;
  projectId?: string;
}

export function TenantCommandPalette({
  open,
  onOpenChange,
  onOpenAi,
  onOpenHelp,
  projectId,
}: TenantCommandPaletteProps) {
  const [query, setQuery] = React.useState("");

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

  const handleSelectAction = (action: () => void) => {
    action();
    onOpenChange(false);
    setQuery("");
  };

  return (
    <CommandPaletteRoot open={open} onOpenChange={onOpenChange}>
      <TenantCommandPaletteContent
        query={query}
        onQueryChange={setQuery}
        onSelectAction={handleSelectAction}
        onOpenAi={onOpenAi}
        onOpenHelp={onOpenHelp}
        projectId={projectId}
      />
    </CommandPaletteRoot>
  );
}
