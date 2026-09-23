import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map as MapIcon,
  Server,
  Users,
  AlertCircle,
  Settings,
  BookOpen,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@k2net/ui";
import { useSidebarMode } from "../sidebar-mode-context";
import { TenantSidebarControl } from "../TenantSidebarControl";

export interface TenantNavItem {
  title: string;
  icon: React.ElementType;
  href?: string;
  onClick?: () => void;
}

export const TENANT_CORE_NAV_ITEMS: TenantNavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/" },
  { title: "Peta Spasial GIS", icon: MapIcon, href: "/map" },
  { title: "Inventaris Jaringan", icon: Server, href: "/inventory" },
  { title: "Data Pelanggan", icon: Users, href: "/customers" },
  { title: "Gangguan & Redaman", icon: AlertCircle, href: "/issues" },
];

export const checkIsActive = (href: string | undefined, pathname: string) => {
  if (!href) return false;
  if (href === "/" || href === "/dashboard") {
    return pathname === "/" || pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(href);
};

interface TenantSidebarProps {
  onOpenHelp: () => void;
}

export function TenantSidebar({ onOpenHelp }: TenantSidebarProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { sidebarMode } = useSidebarMode();
  const [isHovering, setIsHovering] = React.useState(false);

  const bottomNavItems: TenantNavItem[] = React.useMemo(
    () => [
      { title: "Pengaturan Tenant", icon: Settings, href: "/settings" },
      { title: "Panduan & SOP", icon: BookOpen, onClick: onOpenHelp },
    ],
    [onOpenHelp]
  );

  // Determine visual expansion
  const isExpanded =
    sidebarMode === "expanded" || (sidebarMode === "hover" && isHovering);

  const isFloating = sidebarMode === "hover";

  const renderNavButton = (item: TenantNavItem) => {
    const Icon = item.icon;
    const isActive = checkIsActive(item.href, currentPath);

    const button = (
      <div
        onClick={item.onClick}
        className={cn(
          "flex items-center rounded-lg h-8 cursor-pointer justify-start w-full pl-[9px] pr-2.5 transition-colors duration-200 group relative",
          isActive
            ? "text-sidebar-foreground bg-sidebar-accent"
            : "text-sidebar-foreground/90 dark:text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        )}
      >
        <div className="relative flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4" />
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
      </div>
    );

    const wrapped = item.href ? (
      <Link key={item.title} to={item.href}>
        {button}
      </Link>
    ) : (
      <div key={item.title}>{button}</div>
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

    return <React.Fragment key={item.title}>{wrapped}</React.Fragment>;
  };

  return (
    <>
      {isFloating && (
        <div className="hidden md:block w-[50px] shrink-0 h-full" />
      )}

      <aside
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={
          isFloating
            ? {
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: 50,
                boxShadow: "none",
              }
            : undefined
        }
        className={`hidden md:flex border-r border-border/40 flex-col bg-sidebar shrink-0 h-full transition-all duration-300 ease-in-out overflow-hidden ${
          isFloating ? "" : "z-50"
        } ${isExpanded ? "w-[200px]" : "w-[50px]"}`}
      >
        <div className="flex flex-col h-full py-4">
          <TooltipProvider delayDuration={0}>
            {/* Top Primary Navigation Items */}
            <nav className="flex flex-col gap-1 px-2">
              <div className="flex flex-col gap-1">
                {TENANT_CORE_NAV_ITEMS.map(renderNavButton)}
              </div>
            </nav>

            {/* Dynamic Spacer pushing bottom items to bottom */}
            <div className="flex-1" />

            {/* Bottom Utility Items */}
            <nav className="flex flex-col gap-1 px-2 border-groove-t pt-2.5 mb-2">
              {bottomNavItems.map(renderNavButton)}
            </nav>
          </TooltipProvider>

          {/* Bottom Sidebar Expand/Collapse Control */}
          <div className="flex flex-col gap-2 px-2">
            <div className="flex items-center rounded-lg h-8 w-full pl-[5px] pr-2.5 justify-start">
              <TenantSidebarControl isExpanded={isExpanded} />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
