import * as React from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, ShieldCheck, FolderKanban } from "lucide-react";
import { cn } from "@k2net/ui";
import {
  ORG_NAV_ITEMS,
  ORG_SECONDARY_CONFIGS,
  getProjectNavItems,
  getProjectSecondaryConfigs,
  type NavItem,
  type SecondarySidebarConfig,
} from "../../../config/tenant-sidebar-navigation";
import { useAuth } from "@k2net/auth/client";

interface TenantMobileMenuTabProps {
  pathname: string;
  projectId?: string;
  onNavigate: (href: string) => void;
  onClose: () => void;
}

export function TenantMobileMenuTab({
  pathname,
  projectId,
  onNavigate,
  onClose,
}: TenantMobileMenuTabProps) {
  const { user } = useAuth();
  const resolvedProjectId = projectId || "proj-bdg-01";
  const isProjectScope = Boolean(pathname.startsWith(`/project/`));

  const [activeSecondaryKey, setActiveSecondaryKey] = React.useState<string | null>(null);

  // Check if current route matches an active item
  const isItemActive = (href: string) => {
    if (href === "/projects") {
      return pathname === "/projects" || pathname === "/";
    }
    return pathname === href || pathname.startsWith(href);
  };

  const navItems: NavItem[] = isProjectScope
    ? getProjectNavItems(resolvedProjectId)
    : ORG_NAV_ITEMS;

  const secondaryConfigs: Record<string, SecondarySidebarConfig> = isProjectScope
    ? getProjectSecondaryConfigs(resolvedProjectId)
    : ORG_SECONDARY_CONFIGS;

  const currentSecondaryConfig: SecondarySidebarConfig | undefined = activeSecondaryKey
    ? secondaryConfigs[activeSecondaryKey]
    : undefined;

  // Render Secondary (Sub-Menu) View
  if (activeSecondaryKey && currentSecondaryConfig) {
    const HeaderIcon = currentSecondaryConfig.icon;

    return (
      <div className="flex flex-col h-full overflow-hidden animate-in slide-in-from-right-4 duration-200">
        {/* Back Header */}
        <div className="flex items-center gap-2 p-3 border-b border-border/60 bg-muted/30 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSecondaryKey(null)}
            className="flex size-8 items-center justify-center rounded-md hover:bg-muted text-foreground transition-colors cursor-pointer"
            aria-label="Kembali"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex size-6 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
              <HeaderIcon className="size-3.5" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold leading-none truncate text-foreground">
                {currentSecondaryConfig.headerTitle}
              </span>
              {currentSecondaryConfig.headerSubtitle && (
                <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {currentSecondaryConfig.headerSubtitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sub-menu Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          {currentSecondaryConfig.sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
                  {section.title}
                </p>
              )}
              {section.items.map((subItem) => {
                const SubIcon = subItem.icon;
                const active = pathname === subItem.href;

                return (
                  <button
                    key={subItem.id}
                    type="button"
                    onClick={() => {
                      onNavigate(subItem.href);
                      onClose();
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                      active
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SubIcon className={cn("size-3.5 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                      <span className="truncate">{subItem.title}</span>
                    </div>
                    {subItem.badge && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {subItem.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render Primary Nav Level
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scope Header Bar */}
      <div className="flex items-center justify-between p-3.5 border-b border-border/60 bg-muted/20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
            {isProjectScope ? <FolderKanban className="size-4" /> : <ShieldCheck className="size-4" />}
          </div>
          <div>
            <p className="text-xs font-bold leading-tight text-foreground">
              {isProjectScope ? "Project Workspace Scope" : "Organization Workspace Scope"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {user?.tenantSlug ? `${user.tenantSlug.toUpperCase()} Portal` : "Tenant Portal"}
            </p>
          </div>
        </div>

        {isProjectScope && (
          <button
            type="button"
            onClick={() => {
              onNavigate("/projects");
              onClose();
            }}
            className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline cursor-pointer"
          >
            <ArrowLeft className="size-3" />
            <span>Semua Proyek</span>
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {navItems.map((item: NavItem) => {
          const Icon = item.icon;
          const active = isItemActive(item.href);
          const hasSecondary = Boolean(item.hasSecondarySidebar && secondaryConfigs[item.id]);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (hasSecondary) {
                  setActiveSecondaryKey(item.id);
                } else {
                  onNavigate(item.href);
                  onClose();
                }
              }}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs transition-colors cursor-pointer",
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                <span className="truncate">{item.title}</span>
              </div>
              {hasSecondary && (
                <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
