import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, PanelLeftOpen, Search } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SecondarySidebarHeader,
  Input,
} from "@k2net/ui";
import {
  ORG_SECONDARY_CONFIGS,
  getProjectSecondaryConfigs,
  type SecondarySidebarConfig,
  type SubMenuItem,
} from "../../config/tenant-sidebar-navigation";

interface TenantSecondarySidebarProps {
  projectId?: string | null;
}

export function TenantSecondarySidebar({ projectId }: TenantSecondarySidebarProps) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Determine active config
  const activeConfig = React.useMemo<SecondarySidebarConfig | null>(() => {
    if (projectId) {
      // Layer 2: Project Scope
      const configs = getProjectSecondaryConfigs(projectId);
      if (pathname.includes(`/project/${projectId}/infrastructure`)) return configs.infrastructure;
      if (pathname.includes(`/project/${projectId}/inventory`)) return configs.inventory;
      if (pathname.includes(`/project/${projectId}/core`)) return configs.core;
      if (pathname.includes(`/project/${projectId}/users`)) return configs.users;
      if (pathname.includes(`/project/${projectId}/issues`)) return configs.issues;
      if (pathname.includes(`/project/${projectId}/settings`)) return configs.settings;
      return null;
    } else {
      // Layer 1: Org Scope
      if (pathname.startsWith("/team")) return ORG_SECONDARY_CONFIGS.team;
      if (pathname.startsWith("/settings")) return ORG_SECONDARY_CONFIGS.settings;
      return null;
    }
  }, [pathname, projectId]);

  if (!activeConfig) return null;

  const filteredSections = activeConfig.sections.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <div className="relative h-full flex shrink-0 select-none">
      <aside
        className={`${
          isCollapsed ? "w-0 border-r-0" : "w-[240px] border-r border-border/40"
        } transition-all duration-300 ease-in-out shrink-0 bg-sidebar h-full hidden md:flex flex-col overflow-hidden`}
      >
        <SecondarySidebarHeader
          title={activeConfig.headerTitle}
          onCollapse={() => setIsCollapsed(!isCollapsed)}
        />

        {/* Subtitle & Quick Search */}
        <div className="px-3 pt-2 pb-1.5 space-y-2 border-b border-border/20">
          {activeConfig.headerSubtitle && (
            <p className="text-[11px] text-muted-foreground line-clamp-1">
              {activeConfig.headerSubtitle}
            </p>
          )}
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari sub-menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-7 text-[11px] bg-muted/40 border-border/40 rounded-md focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Navigation Item Tree */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-4 min-w-[240px]">
          {filteredSections.map((section, sIdx) => (
            <Collapsible key={sIdx} defaultOpen className="w-full">
              {section.title && (
                <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
                  <span>{section.title}</span>
                  <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
              )}
              <CollapsibleContent className="space-y-1 mt-1">
                {section.items.map((item: SubMenuItem) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      className={`group px-2.5 py-2 text-xs rounded-md transition-all flex flex-col gap-0.5 ${
                        isActive
                          ? "bg-sidebar-accent text-foreground font-semibold border border-border/40 shadow-xs"
                          : "text-foreground/80 dark:text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        />
                        <span className="truncate flex-1">{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <span className="text-[10px] text-muted-foreground font-normal line-clamp-1 pl-5.5">
                          {item.description}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </aside>

      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          title="Buka sidebar navigasi modul"
          className="absolute top-2.5 left-3 z-40 p-1.5 rounded-md bg-muted border border-border shadow-md hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-300"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
