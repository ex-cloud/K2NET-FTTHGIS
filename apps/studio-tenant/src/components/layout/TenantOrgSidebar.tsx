import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ActionTooltip,
  TooltipProvider,
  PrimarySidebarShell,
  useSidebarMode,
  cn,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { ORG_NAV_ITEMS, type NavItem } from "../../config/tenant-sidebar-navigation";

export function TenantOrgSidebar() {
  const { t } = useTranslation();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { sidebarMode } = useSidebarMode();
  const [isHovering, setIsHovering] = React.useState(false);

  const isExpanded =
    sidebarMode === "expanded" || (sidebarMode === "hover" && isHovering);
  const isFloating = sidebarMode === "hover";

  const mainNavItems = React.useMemo(
    () => ORG_NAV_ITEMS.filter((item) => item.id !== "settings"),
    []
  );
  const bottomNavItems = React.useMemo(
    () => ORG_NAV_ITEMS.filter((item) => item.id === "settings"),
    []
  );

  const checkIsActive = (href: string) => {
    if (href === "/projects" || href === "/") {
      return currentPath === "/projects" || currentPath === "/" || currentPath.startsWith("/projects/");
    }
    return currentPath === href || currentPath.startsWith(href);
  };

  const renderNavButton = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = checkIsActive(item.href);
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
          <Icon className={cn("h-4 w-4", isActive ? "text-sidebar-foreground" : "text-muted-foreground group-hover:text-foreground")} />
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
          {/* Top Primary Org Navigation Items */}
          <nav className="flex flex-col gap-1 px-2">
            <div className="flex flex-col gap-1">
              {mainNavItems.map(renderNavButton)}
            </div>

            {/* Settings Navigation with divider (groove) */}
            {bottomNavItems.length > 0 && (
              <div className="pt-2 mt-1.5 border-groove-t flex flex-col gap-1">
                {bottomNavItems.map(renderNavButton)}
              </div>
            )}
          </nav>
        </TooltipProvider>
      }
    />
  );
}
