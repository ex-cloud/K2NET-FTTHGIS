import * as React from "react";
import {
  ActionTooltip,
  PrimarySidebarShell,
  TooltipProvider,
  useSidebarMode,
} from "@k2net/ui";
import { useTranslation, type TranslationKey } from "@k2net/i18n";
import { Link, usePathname } from "@/lib/navigation-compat";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/store/task-store";
import { usePermissions } from "@/hooks/use-permissions";
import {
  NAVIGATION_MANIFEST,
  NAVIGATION_PLANES,
  isNavItemActive,
  type ManifestNavItem,
  type NavigationPlane,
} from "@/config/navigation-manifest";

export type NavItem = ManifestNavItem;

// ── Backwards-Compatible Exports (Used by mobile drawers & external tools) ────
export const ADMIN_NAV_ITEMS: ManifestNavItem[] = NAVIGATION_MANIFEST.filter(
  (item) => item.plane !== "BOTTOM"
);

export const ADMIN_BOTTOM_NAV_ITEMS: ManifestNavItem[] = NAVIGATION_MANIFEST.filter(
  (item) => item.plane === "BOTTOM"
);

export const ADMIN_CORE_NAV_ITEMS: ManifestNavItem[] = NAVIGATION_MANIFEST.filter(
  (item) => item.plane === "HOME" || item.plane === "OPERATIONS"
);

export const ADMIN_PLATFORM_NAV_ITEMS: ManifestNavItem[] = NAVIGATION_MANIFEST.filter(
  (item) => item.plane === "PRODUCT" || item.plane === "PLATFORM" || item.plane === "GOVERNANCE"
);

export const ADMIN_SYSTEM_NAV_ITEMS: ManifestNavItem[] = ADMIN_BOTTOM_NAV_ITEMS;

export const checkIsActive = (href: string, pathname: string): boolean => {
  const item = NAVIGATION_MANIFEST.find((i) => i.href === href);
  if (item) return isNavItemActive(item, pathname);
  return pathname === href || pathname.startsWith(href);
};

export function AdminSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { sidebarMode } = useSidebarMode();
  const [isHovering, setIsHovering] = React.useState(false);
  const unreadB2BCount = useTaskStore((state) => state.unreadB2BCount);
  const { canAccess } = usePermissions();

  // Determine visual expansion
  const isExpanded =
    sidebarMode === "expanded" || (sidebarMode === "hover" && isHovering);

  const isFloating = sidebarMode === "hover";

  // Filter accessible items per plane
  const planeItems = React.useMemo(() => {
    const planes: { plane: NavigationPlane; labelKey?: TranslationKey; items: ManifestNavItem[] }[] = [];

    for (const p of NAVIGATION_PLANES) {
      if (p.plane === "BOTTOM") continue;
      const visible = NAVIGATION_MANIFEST.filter(
        (item) => item.plane === p.plane && canAccess(item.requiredPermission)
      );
      if (visible.length > 0) {
        planes.push({
          plane: p.plane,
          labelKey: p.labelKey,
          items: visible,
        });
      }
    }
    return planes;
  }, [canAccess]);

  const visibleBottomItems = React.useMemo(
    () =>
      NAVIGATION_MANIFEST.filter(
        (item) => item.plane === "BOTTOM" && canAccess(item.requiredPermission)
      ),
    [canAccess]
  );

  const renderNavButton = (item: ManifestNavItem) => {
    const Icon = item.icon;
    const isActive = isNavItemActive(item, pathname);
    const label = item.translationKey ? t(item.translationKey) : item.title;
    const tooltipLabel = t("nav.go_to_item", { name: label });

    const button = (
      <div
        className={cn(
          "flex items-center rounded-lg h-8 cursor-pointer justify-start w-full pl-[9px] pr-2.5 transition-colors duration-200 group relative",
          isActive
            ? "text-sidebar-foreground bg-sidebar-accent"
            : "text-sidebar-foreground/90 dark:text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        )}
      >
        <div className="relative flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4" />
          {item.badgeKey === "unreadB2B" && unreadB2BCount > 0 && !isExpanded && (
            <>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full" />
            </>
          )}
        </div>
        <span
          className={cn(
            "text-sm whitespace-nowrap transition-all duration-300 flex-1",
            isActive ? "font-semibold text-sidebar-foreground" : "font-medium",
            isExpanded ? "opacity-100 w-auto ml-3" : "opacity-0 w-0 overflow-hidden ml-0"
          )}
        >
          {label}
        </span>
        {item.badgeKey === "unreadB2B" && unreadB2BCount > 0 && isExpanded && (
          <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center animate-pulse">
            {unreadB2BCount}
          </span>
        )}
      </div>
    );

    const wrapped = (
      <Link key={item.id} href={item.href}>
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
          {/* Top Primary Navigation Items — 5 Semantic Planes */}
          <nav className="flex flex-col gap-1 px-2">
            {planeItems.map((group, gIdx) => {
              const planeLabel = group.labelKey ? t(group.labelKey) : group.plane;
              return (
                <div
                  key={group.plane}
                  className={cn(
                    "flex flex-col gap-1",
                    gIdx > 0 && "pt-2 mt-1.5 border-groove-t"
                  )}
                >
                  {isExpanded && planeLabel && (
                    <div className="px-2 pt-0.5 pb-0.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 font-semibold select-none">
                        {planeLabel}
                      </span>
                    </div>
                  )}
                  {group.items.map(renderNavButton)}
                </div>
              );
            })}
          </nav>
        </TooltipProvider>
      }
      bottomNav={
        visibleBottomItems.length > 0 ? (
          <TooltipProvider delayDuration={0}>
            {visibleBottomItems.map(renderNavButton)}
          </TooltipProvider>
        ) : undefined
      }
    />
  );
}
