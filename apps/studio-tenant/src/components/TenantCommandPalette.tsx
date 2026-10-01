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
  Boxes,
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
import { useTranslation } from "@k2net/i18n";

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
  const { t } = useTranslation();
  const isDark = resolvedTheme === "dark";

  const resolvedProjectId = projectId || "proj-bdg-01";

  const pages = React.useMemo(() => {
    return [
      {
        id: "nav-dash",
        label: t("nav.operational_dashboard"),
        path: `/project/${resolvedProjectId}/dashboard`,
        icon: LayoutDashboard,
        badge: "Home",
      },
      {
        id: "nav-gis",
        label: t("nav.gis_spatial_map"),
        path: `/project/${resolvedProjectId}/gis/topology`,
        icon: MapIcon,
        badge: "GIS",
      },
      {
        id: "nav-inv",
        label: t("nav.network_inventory"),
        path: `/project/${resolvedProjectId}/core/olt`,
        icon: Server,
        badge: "Inventory",
      },
      {
        id: "nav-cust",
        label: t("nav.subscribers_pppoe"),
        path: `/project/${resolvedProjectId}/subscribers/list`,
        icon: Users,
        badge: "ONU/PPPoE",
      },
      {
        id: "nav-issues",
        label: t("nav.issues_monitoring"),
        path: `/project/${resolvedProjectId}/issues/tickets`,
        icon: AlertCircle,
        badge: "Alerts",
      },
      {
        id: "nav-org-projects",
        label: t("nav.all_projects_workspace"),
        path: "/projects",
        icon: Boxes,
        badge: "Projects",
      },
      {
        id: "nav-org-billing",
        label: t("nav.billing_subscription"),
        path: "/billing",
        icon: CreditCard,
        badge: "Billing",
      },
      {
        id: "nav-org-members",
        label: t("nav.members_access"),
        path: "/members",
        icon: UserCheck,
        badge: "IAM",
      },
      {
        id: "nav-settings",
        label: t("nav.settings_domain"),
        path: "/settings",
        icon: Settings,
        badge: "Config",
      },
    ];
  }, [resolvedProjectId, t]);

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
        placeholder={t("common.search_commands_tenant")}
      />

      <div className="flex-1 overflow-y-auto p-1 divide-y divide-border/40">
        {/* Navigation Group */}
        {filteredPages.length > 0 && (
          <CommandPaletteGroup heading={t("common.heading_pages_modules")}>
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
        <CommandPaletteGroup heading={t("common.heading_quick_actions")}>
          <CommandPaletteItem
            icon={Plus}
            badgeText="Action"
            onSelect={() =>
              onSelectAction(() =>
                navigate({ to: `/project/${resolvedProjectId}/subscribers/list` as never })
              )
            }
          >
            {t("nav.register_new_subscriber")}
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
            {t("nav.open_ai_copilot")}
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
            {t("nav.open_guide_sop")}
          </CommandPaletteItem>

          <CommandPaletteItem
            icon={isDark ? Sun : Moon}
            badgeText="Theme"
            onSelect={() => onSelectAction(() => setTheme(isDark ? "light" : "dark"))}
          >
            {t("common.toggle_theme", { mode: isDark ? t("common.light_mode") : t("common.dark_mode") })}
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
            {t("nav.logout_session")}
          </CommandPaletteItem>
        </CommandPaletteGroup>

        {filteredPages.length === 0 && query.trim() !== "" && (
          <div className="py-12 text-center text-xs text-muted-foreground">
            {t("common.no_results_for", { query })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border/80 px-4 py-2 bg-muted/20 text-[10px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-3">
          <span>
            <kbd className="font-mono bg-muted px-1 py-0.5 rounded border border-border">↑↓</kbd> {t("common.select_key")}
          </span>
          <span>
            <kbd className="font-mono bg-muted px-1 py-0.5 rounded border border-border">↵</kbd> {t("common.open_key")}
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
