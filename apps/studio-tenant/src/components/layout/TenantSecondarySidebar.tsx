import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, PanelLeftOpen } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SecondarySidebarHeader,
  ActionTooltip,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  ORG_SECONDARY_CONFIGS,
  getProjectSecondaryConfigs,
  type SecondarySidebarConfig,
  type SubMenuItem,
} from "../../config/tenant-sidebar-navigation";
import { usePermissions } from "../../hooks/use-permissions";

interface TenantSecondarySidebarProps {
  projectId?: string | null;
}

export function TenantSecondarySidebar({ projectId }: TenantSecondarySidebarProps) {
  const { t } = useTranslation();
  const { canAccess } = usePermissions();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Determine active config
  const activeConfig = React.useMemo<SecondarySidebarConfig | null>(() => {
    let rawConfig: SecondarySidebarConfig | null = null;
    if (projectId) {
      // Layer 2: Project Scope
      const configs = getProjectSecondaryConfigs(projectId);
      if (pathname.includes(`/project/${projectId}/infrastructure`)) rawConfig = configs.infrastructure;
      else if (pathname.includes(`/project/${projectId}/inventory`)) rawConfig = configs.inventory;
      else if (pathname.includes(`/project/${projectId}/core`)) rawConfig = configs.core;
      else if (pathname.includes(`/project/${projectId}/users`)) rawConfig = configs.users;
      else if (pathname.includes(`/project/${projectId}/issues`)) rawConfig = configs.issues;
      else if (pathname.includes(`/project/${projectId}/settings`)) rawConfig = configs.settings;
    } else {
      // Layer 1: Org Scope
      if (pathname.startsWith("/team")) rawConfig = ORG_SECONDARY_CONFIGS.team;
      else if (pathname.startsWith("/settings")) rawConfig = ORG_SECONDARY_CONFIGS.settings;
      else if (pathname.startsWith("/billing")) rawConfig = ORG_SECONDARY_CONFIGS.billing;
      else if (pathname.startsWith("/developer") || pathname.startsWith("/integrations")) rawConfig = ORG_SECONDARY_CONFIGS.integrations;
    }

    if (!rawConfig) return null;

    const filteredSections = rawConfig.sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => canAccess(item.requiredPermission)),
      }))
      .filter((section) => section.items.length > 0);

    if (filteredSections.length === 0) return null;

    return {
      ...rawConfig,
      sections: filteredSections,
    };
  }, [pathname, projectId, canAccess]);

  if (!activeConfig) return null;

  return (
    <div className="relative h-full flex shrink-0 select-none">
      <aside
        className={`${
          isCollapsed ? "w-0 border-r-0" : "w-[240px] border-r border-border/80"
        } transition-all duration-300 ease-in-out shrink-0 bg-sidebar h-full hidden md:flex flex-col overflow-hidden`}
      >
        <SecondarySidebarHeader
          title={activeConfig.translationKey ? t(activeConfig.translationKey) : activeConfig.headerTitle}
          onCollapse={() => setIsCollapsed(!isCollapsed)}
        />

        {/* Navigation Item Tree */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6 min-w-[240px]">
          {activeConfig.sections.map((section, sIdx) => {
            const sectionTitle = section.translationKey ? t(section.translationKey) : section.title;
            return (
              <Collapsible key={sIdx} defaultOpen className="w-full">
                {sectionTitle && (
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
                    <span>{sectionTitle}</span>
                    <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                )}
                <CollapsibleContent className="space-y-0.5 mt-2">
                  {section.items.map((item: SubMenuItem) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    const itemTitle = item.translationKey ? t(item.translationKey) : item.title;

                    return (
                      <ActionTooltip
                        key={item.id}
                        label={t("nav.go_to_item", { name: itemTitle })}
                        shortcut={item.shortcut}
                        side="right"
                        sideOffset={8}
                      >
                        <Link
                          to={item.href}
                          className={`px-2.5 py-1.5 text-xs rounded-md transition-all flex items-center gap-2.5 ${
                            isActive
                              ? "bg-sidebar-accent text-foreground font-semibold border border-border/80"
                              : "text-foreground/85 dark:text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium"
                          }`}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? "text-foreground" : "text-foreground/70 dark:text-muted-foreground"
                            }`}
                          />
                          <span className="truncate flex-1">{itemTitle}</span>
                          {item.badge && (
                            <span className="ml-auto text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </ActionTooltip>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </aside>

      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          title={t("common.open")}
          className="absolute top-2.5 left-3 z-40 p-1.5 rounded-md bg-muted border border-border shadow-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-300"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
