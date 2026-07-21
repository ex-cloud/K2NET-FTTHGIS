"use client";

import * as React from "react";
import {
  Settings,
  Building2,
  Users,
  BarChart3,
  Activity,
  History,
  Lock,
  Cpu,
  LayoutDashboard,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@k2net/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarMode } from "@/components/sidebar-mode-context";
import { SidebarControl } from "@/components/sidebar-control";
import { cn } from "@/lib/utils";

export type NavItem = {
  title: string;
  icon: React.ElementType;
  href: string;
};

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { title: "Overview", icon: LayoutDashboard, href: "/overview" },
  { title: "Organizations", icon: Building2, href: "/organizations" },
  { title: "Global Users", icon: Users, href: "/users" },
  { title: "System Health", icon: Activity, href: "/health" },
  { title: "Usage Metrics", icon: BarChart3, href: "/metrics" },
  { title: "Audit Logs", icon: History, href: "/logs" },
  { title: "Security", icon: Lock, href: "/security" },
  { title: "Gateways", icon: Cpu, href: "/gateways/overview" },
  { title: "Settings", icon: Settings, href: "/settings" },
];

export const checkIsActive = (href: string, pathname: string) => {
  if (href === "/overview") return pathname === "/overview";
  if (href.startsWith("/gateways")) return pathname.startsWith("/gateways");
  return pathname === href || pathname.startsWith(href);
};

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarMode } = useSidebarMode();
  const [isHovering, setIsHovering] = React.useState(false);

  // Determine visual expansion
  const isExpanded =
    sidebarMode === "expanded" || (sidebarMode === "hover" && isHovering);

  const isFloating = sidebarMode === "hover";

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
        className={`hidden md:flex border-r border-border flex-col bg-sidebar shrink-0 h-full transition-all duration-300 ease-in-out overflow-hidden ${
          isFloating ? "" : "z-50"
        } ${isExpanded ? "w-[200px]" : "w-[50px]"}`}
      >
        <div className="flex flex-col h-full py-4">
          <TooltipProvider delayDuration={0}>
            <nav className="flex flex-col gap-1 px-2">
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = checkIsActive(item.href, pathname);
                const button = (
                  <div
                    className={cn(
                      "flex items-center rounded-lg h-8 cursor-pointer justify-start w-full pl-[9px] pr-2.5 transition-colors duration-200 group",
                      isActive
                        ? "text-primary bg-primary/10 hover:bg-primary/20"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span
                      className={cn(
                        "text-sm font-medium whitespace-nowrap transition-all duration-300",
                        isExpanded ? "opacity-100 w-auto ml-3" : "opacity-0 w-0 overflow-hidden ml-0"
                      )}
                    >
                      {item.title}
                    </span>
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

                return wrapped;
              })}
            </nav>
          </TooltipProvider>

          <div className="flex-1" />

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
