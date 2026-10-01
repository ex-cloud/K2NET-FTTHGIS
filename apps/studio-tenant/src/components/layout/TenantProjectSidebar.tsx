import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ActionTooltip,
  TooltipProvider,
  PrimarySidebarShell,
  useSidebarMode,
  cn,
} from "@k2net/ui";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import { getProjectNavItems, type NavItem } from "../../config/tenant-sidebar-navigation";

interface TenantProjectSidebarProps {
  projectId: string;
}

export function TenantProjectSidebar({
  projectId,
}: TenantProjectSidebarProps) {
  const { t } = useTranslation();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { sidebarMode } = useSidebarMode();
  const [isHovering, setIsHovering] = React.useState(false);

  const isExpanded =
    sidebarMode === "expanded" || (sidebarMode === "hover" && isHovering);
  const isFloating = sidebarMode === "hover";

  const navItems = React.useMemo(() => getProjectNavItems(projectId), [projectId]);

  const mainNavItems = React.useMemo(
    () => navItems.filter((item) => item.id !== "settings"),
    [navItems]
  );
  const bottomNavItems = React.useMemo(
    () => navItems.filter((item) => item.id === "settings"),
    [navItems]
  );

  const checkIsActive = (item: NavItem) => {
    if (item.id === "overview") {
      return currentPath === `/project/${projectId}/overview` || currentPath === `/project/${projectId}`;
    }
    return currentPath.includes(`/project/${projectId}/${item.id}`);
  };

  const renderNavButton = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = checkIsActive(item);
    const itemTitle = item.translationKey ? t(item.translationKey) : item.title;
    const tooltipLabel = t("nav.go_to_item", { name: itemTitle });

    const button = (
      <div
        className={cn(
          "flex items-center rounded-lg h-8 cursor-pointer justify-start w-full pl-[9px] pr-2.5 transition-colors duration-200 group relative select-none",
          isActive
            ? "text-sidebar-foreground bg-sidebar-accent font-semibold"
            : "text-sidebar-foreground/90 dark:text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent font-medium"
        )}
      >
        <div className="relative flex items-center justify-center shrink-0">
          <Icon
            className={cn(
              "h-4 w-4",
              isActive ? "text-sidebar-foreground" : "text-muted-foreground group-hover:text-foreground"
            )}
          />
        </div>
        <span
          className={cn(
            "text-sm whitespace-nowrap transition-all duration-300 flex-1 truncate",
            isActive ? "font-semibold text-sidebar-foreground" : "font-medium",
            isExpanded ? "opacity-100 w-auto ml-3" : "opacity-0 w-0 overflow-hidden ml-0"
          )}
        >
          {itemTitle}
        </span>
      </div>
    );

    const wrapped = (
      <Link key={item.id} to={item.href}>
        {button}
      </Link>
    );

    return (
      <ActionTooltip
        key={item.id}
        label={tooltipLabel}
        shortcut={item.shortcut}
        side="right"
        sideOffset={12}
      >
        {wrapped}
      </ActionTooltip>
    );
  };

  return (
    <PrimarySidebarShell
      isExpanded={isExpanded}
      isFloating={isFloating}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      topSection={
        <TooltipProvider delayDuration={0}>
          {/* Top Back to Org Level Button */}
          <div className="px-2 mb-2 pb-2 border-b border-border/80">
            <ActionTooltip
              label={t("nav.go_to_item", { name: t("nav.all_projects") })}
              shortcut="G then P"
              side="right"
              sideOffset={12}
            >
              <Link to="/projects">
                <div
                  className={cn(
                    "flex items-center rounded-lg h-8 cursor-pointer justify-start w-full pl-[9px] pr-2.5 transition-colors duration-200 group relative text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium select-none"
                  )}
                >
                  <div className="relative flex items-center justify-center shrink-0">
                    <ArrowLeft className="h-4 w-4" />
                  </div>
                  <span
                    className={cn(
                      "text-sm whitespace-nowrap transition-all duration-300 flex-1 truncate",
                      isExpanded ? "opacity-100 w-auto ml-3" : "opacity-0 w-0 overflow-hidden ml-0"
                    )}
                  >
                    {t("nav.all_projects")}
                  </span>
                </div>
              </Link>
            </ActionTooltip>
          </div>

          {/* Primary Project Navigation Items */}
          <nav className="flex flex-col gap-1 px-2">
            <div className="flex flex-col gap-1">
              {mainNavItems.map(renderNavButton)}
            </div>
          </nav>
        </TooltipProvider>
      }
      bottomNav={
        <TooltipProvider delayDuration={0}>
          {bottomNavItems.map(renderNavButton)}
        </TooltipProvider>
      }
    />
  );
}
