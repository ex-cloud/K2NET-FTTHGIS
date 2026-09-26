import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  Box,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@k2net/ui";
import {
  ORG_NAV_ITEMS,
  ORG_SECONDARY_CONFIGS,
  getProjectNavItems,
  getProjectSecondaryConfigs,
  type NavItem,
  type SecondarySidebarConfig,
} from "../../../config/tenant-sidebar-navigation";
import { useTenantInfo } from "../../../hooks/useTenantInfo";

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
  const { organizationName } = useTenantInfo();
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
    return (
      <div className="flex flex-col flex-1 overflow-hidden animate-in fade-in-0 duration-200 slide-in-from-right-3">
        {/* Back Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 bg-muted/20 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSecondaryKey(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer group py-0.5"
          >
            <ChevronLeft className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="truncate">{currentSecondaryConfig.headerTitle}</span>
          </button>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Sub-menu</span>
        </div>

        {/* Sub-menu Sections & Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {currentSecondaryConfig.sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && (
                <p className="px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 font-semibold">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((subItem) => {
                  const SubIcon = subItem.icon || LayoutDashboard;
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
                        "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors text-left cursor-pointer",
                        active
                          ? "bg-primary/10 text-primary font-semibold border border-primary/20 shadow-xs"
                          : "text-foreground/80 hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SubIcon
                          className={cn(
                            "size-3.5 shrink-0",
                            active ? "text-primary" : "text-muted-foreground"
                          )}
                        />
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
            </div>
          ))}
        </div>

        {/* Footer Back Bar */}
        <div className="p-3 border-t border-border/60 bg-muted/20 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setActiveSecondaryKey(null)}
            className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <ChevronLeft className="size-3" /> Kembali ke Menu Utama
          </button>
          <span className="text-[10px] text-muted-foreground font-mono">
            {currentSecondaryConfig.headerTitle}
          </span>
        </div>
      </div>
    );
  }

  // Render Primary Nav Level
  return (
    <div className="flex flex-col flex-1 overflow-hidden animate-in fade-in-0 duration-200 slide-in-from-left-3">
      {/* Scope Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 bg-muted/20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-5 rounded bg-muted/50 border border-border/80 flex items-center justify-center text-foreground/80 shrink-0">
            {isProjectScope ? <Box className="size-3" /> : <ShieldCheck className="size-3 text-primary" />}
          </div>
          <span className="text-xs font-bold text-foreground truncate">
            {isProjectScope
              ? `Project Workspace (${resolvedProjectId.toUpperCase()})`
              : (organizationName ? `${organizationName} Organization` : "Organization Workspace")}
          </span>
        </div>

        {isProjectScope && (
          <button
            type="button"
            onClick={() => {
              onNavigate("/projects");
              onClose();
            }}
            className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline cursor-pointer shrink-0"
          >
            <ArrowLeft className="size-3" />
            <span>Semua Proyek</span>
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
        <p className="px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold mb-1">
          {isProjectScope ? "Project Navigation" : "Workspace Directives"}
        </p>

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
                "w-full flex items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium transition-colors text-left cursor-pointer group",
                active
                  ? "bg-primary/10 text-primary border border-primary/20 font-semibold"
                  : "text-foreground/85 hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{item.title}</span>
              </div>
              {hasSecondary && (
                <ChevronRight className="size-3.5 text-muted-foreground/60 group-hover:text-foreground transition-transform group-hover:translate-x-0.5 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
