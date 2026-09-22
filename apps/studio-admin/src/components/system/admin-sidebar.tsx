

import * as React from "react";
import {
  Settings,
  Building2,
  Users,
  ScanLine,
  Lock,
  Cpu,
  LayoutDashboard,
  Terminal,
  ClipboardList,
  Sparkles,
  Box,
  Trash2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@k2net/ui";
import { Link, usePathname } from "@/lib/navigation-compat";
import { useSidebarMode } from "@/components/sidebar-mode-context";
import { SidebarControl } from "@/components/sidebar-control";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/store/task-store";
import { usePermissions } from "@/hooks/use-permissions";

export type NavItem = {
  title: string;
  icon: React.ElementType;
  href: string;
  requiredPermission?: string | string[];
};

export const ADMIN_CORE_NAV_ITEMS: NavItem[] = [
  { title: "Overview", icon: LayoutDashboard, href: "/overview" },
  { title: "Organizations", icon: Building2, href: "/organizations", requiredPermission: ["system.organizations.view", "orgs.view"] },
  { title: "Global Users", icon: Users, href: "/users", requiredPermission: ["system.security.manage", "users.view", "roles.view"] },
  { title: "Projects & Issues", icon: ClipboardList, href: "/tasks", requiredPermission: ["system.task.manage", "system.observability.view"] },
];

export const ADMIN_PLATFORM_NAV_ITEMS: NavItem[] = [
  { title: "Observability", icon: ScanLine, href: "/observability", requiredPermission: "system.observability.view" },
  { title: "Global Logs", icon: Terminal, href: "/logs", requiredPermission: "system.audit.view" },
  { title: "Security", icon: Lock, href: "/security/roles", requiredPermission: "system.security.manage" },
  { title: "Gateways", icon: Cpu, href: "/gateways/overview", requiredPermission: ["system.observability.view", "system.gateway.manage"] },
  { title: "AI Assistant", icon: Sparkles, href: "/ai", requiredPermission: ["system.ai.manage", "system.settings.manage"] },
  { title: "3D Assets", icon: Box, href: "/assets-3d", requiredPermission: "system.settings.manage" },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  ...ADMIN_CORE_NAV_ITEMS,
  ...ADMIN_PLATFORM_NAV_ITEMS,
];

export const ADMIN_BOTTOM_NAV_ITEMS: NavItem[] = [
  { title: "Recycle Bin", icon: Trash2, href: "/system/trash", requiredPermission: "system.trash.manage" },
  { title: "Settings", icon: Settings, href: "/settings", requiredPermission: "system.settings.manage" },
];

export const checkIsActive = (href: string, pathname: string) => {
  if (href === "/overview") return pathname === "/overview";
  if (href.startsWith("/ai")) return pathname.startsWith("/ai");
  if (href.startsWith("/gateways")) return pathname.startsWith("/gateways");
  if (href.startsWith("/security")) return pathname.startsWith("/security");
  if (href === "/observability") return pathname.startsWith("/observability");
  if (href === "/tasks") return pathname === "/tasks" || pathname.startsWith("/tasks/");
  if (href === "/system/trash") return pathname.startsWith("/system/trash");
  return pathname === href || pathname.startsWith(href);
};

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarMode } = useSidebarMode();
  const [isHovering, setIsHovering] = React.useState(false);
  const unreadB2BCount = useTaskStore((state) => state.unreadB2BCount);
  const { canAccess } = usePermissions();

  const visibleCoreItems = React.useMemo(
    () => ADMIN_CORE_NAV_ITEMS.filter((item) => canAccess(item.requiredPermission)),
    [canAccess]
  );

  const visiblePlatformItems = React.useMemo(
    () => ADMIN_PLATFORM_NAV_ITEMS.filter((item) => canAccess(item.requiredPermission)),
    [canAccess]
  );

  const visibleBottomNavItems = React.useMemo(
    () => ADMIN_BOTTOM_NAV_ITEMS.filter((item) => canAccess(item.requiredPermission)),
    [canAccess]
  );

  // Determine visual expansion
  const isExpanded =
    sidebarMode === "expanded" || (sidebarMode === "hover" && isHovering);

  const isFloating = sidebarMode === "hover";

  const renderNavButton = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = checkIsActive(item.href, pathname);
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
          {item.href === "/tasks" && unreadB2BCount > 0 && !isExpanded && (
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
          {item.title}
        </span>
        {item.href === "/tasks" && unreadB2BCount > 0 && isExpanded && (
          <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center animate-pulse">
            {unreadB2BCount}
          </span>
        )}
      </div>
    );

    const wrapped = (
      <Link key={item.title} href={item.href}>
        {button}
      </Link>
    );

    if (!isExpanded) {
      return (
        <Tooltip key={item.title}>
          <TooltipTrigger asChild>{wrapped}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <React.Fragment key={item.title}>
        {wrapped}
      </React.Fragment>
    );
  };

  return (
    <>
      {isFloating && (
        <div className="hidden md:block w-[50px] shrink-0 h-full" />
      )}

      <aside
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={isFloating ? {
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          boxShadow: "none",
        } : undefined}
        className={`hidden md:flex border-r border-border/40 flex-col bg-sidebar shrink-0 h-full transition-all duration-300 ease-in-out overflow-hidden ${isFloating ? "" : "z-50"
          } ${isExpanded ? "w-[200px]" : "w-[50px]"}`}
      >
        <div className="flex flex-col h-full py-4">
          <TooltipProvider delayDuration={0}>
            {/* Top Primary Navigation Items — grouped semantically */}
            <nav className="flex flex-col gap-1 px-2">
              {/* Group 1: Core Workspace Navigation */}
              <div className="flex flex-col gap-1">
                {visibleCoreItems.map(renderNavButton)}
              </div>

              {/* Group 2: Platform & Telemetry Operations */}
              {visiblePlatformItems.length > 0 && (
                <div className="pt-2 mt-1.5 border-groove-t flex flex-col gap-1">
                  {visiblePlatformItems.map(renderNavButton)}
                </div>
              )}
            </nav>

            {/* Dynamic Spacer pushing bottom items to the bottom */}
            <div className="flex-1" />

            {/* Bottom Utility Items (Recycle Bin & Settings right above SidebarControl) */}
            <nav className="flex flex-col gap-1 px-2 border-groove-t pt-2.5 mb-2">
              {visibleBottomNavItems.map(renderNavButton)}
            </nav>
          </TooltipProvider>

          {/* Bottom Sidebar Expand/Collapse Control */}
          <div className="flex flex-col gap-2 px-2">
            <div className="flex items-center rounded-lg h-8 w-full pl-[5px] pr-2.5 justify-start">
              <SidebarControl isExpanded={isExpanded} />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
