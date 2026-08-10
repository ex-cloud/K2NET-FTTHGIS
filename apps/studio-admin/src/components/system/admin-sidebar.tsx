"use client";

import * as React from "react";
import {
  Settings,
  Building2,
  Users,
  BarChart3,
  ScanLine,
  History,
  Lock,
  Cpu,
  LayoutDashboard,
  Terminal,
  ClipboardList,
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
import { useTaskStore } from "@/store/task-store";

export type NavItem = {
  title: string;
  icon: React.ElementType;
  href: string;
};

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { title: "Overview", icon: LayoutDashboard, href: "/overview" },
  { title: "Organizations", icon: Building2, href: "/organizations" },
  { title: "Global Users", icon: Users, href: "/users" },
  { title: "Tasks & Tickets", icon: ClipboardList, href: "/tasks" },
  { title: "Observability", icon: ScanLine, href: "/observability" },
  { title: "Global Logs", icon: Terminal, href: "/logs" },
  { title: "Security", icon: Lock, href: "/security" },
  { title: "Gateways", icon: Cpu, href: "/gateways/overview" },
  { title: "Settings", icon: Settings, href: "/settings" },
];

/** Items that get a divider rendered BELOW them to separate logical groups. */
const DIVIDER_AFTER = ["/tasks"];

export const checkIsActive = (href: string, pathname: string) => {
  if (href === "/overview") return pathname === "/overview";
  if (href.startsWith("/gateways")) return pathname.startsWith("/gateways");
  if (href === "/observability") return pathname.startsWith("/observability");
  if (href === "/tasks") return pathname === "/tasks" || pathname.startsWith("/tasks/");
  return pathname === href || pathname.startsWith(href);
};

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarMode } = useSidebarMode();
  const [isHovering, setIsHovering] = React.useState(false);
  const unreadB2BCount = useTaskStore((state) => state.unreadB2BCount);

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
                    <React.Fragment key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>{wrapped}</TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                      {DIVIDER_AFTER.includes(item.href) && (
                        <div className="my-1 mx-1 border-t border-border/30" />
                      )}
                    </React.Fragment>
                  );
                }

                return (
                  <React.Fragment key={item.title}>
                    {wrapped}
                    {DIVIDER_AFTER.includes(item.href) && (
                      <div className="my-1 mx-1 border-t border-border/30" />
                    )}
                  </React.Fragment>
                );
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
