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

type NavItem = {
  title: string;
  icon: React.ElementType;
  href: string | null;
  isActive?: boolean;
};

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarMode } = useSidebarMode();
  const [isHovering, setIsHovering] = React.useState(false);

  // Determine visual expansion
  const isExpanded =
    sidebarMode === "expanded" || (sidebarMode === "hover" && isHovering);

  const isFloating = sidebarMode === "hover";

  const adminNavItems: NavItem[] = [
    {
      title: "Overview",
      icon: LayoutDashboard,
      href: "/overview",
      isActive: pathname === "/overview" || pathname === "/overview",
    },
    {
      title: "Organizations",
      icon: Building2,
      href: "/organizations",
      isActive: pathname === "/organizations" || pathname === "/organizations",
    },
    {
      title: "Global Users",
      icon: Users,
      href: "/users",
      isActive: pathname === "/users" || pathname === "/users" || pathname?.startsWith("/users"),
    },
    {
      title: "System Health",
      icon: Activity,
      href: "/health",
      isActive: pathname === "/health" || pathname === "/health" || pathname?.startsWith("/health"),
    },
    {
      title: "Usage Metrics",
      icon: BarChart3,
      href: "/metrics",
      isActive: pathname === "/metrics" || pathname === "/system/metrics" || pathname?.startsWith("/metrics"),
    },
    {
      title: "Audit Logs",
      icon: History,
      href: "/logs",
      isActive: pathname === "/logs" || pathname === "/system/logs" || pathname?.startsWith("/logs"),
    },
    {
      title: "Security",
      icon: Lock,
      href: "/security",
      isActive: pathname === "/security" || pathname === "/security" || pathname?.startsWith("/security"),
    },
    {
      title: "Gateways",
      icon: Cpu,
      href: "/gateways/overview",
      isActive: pathname?.startsWith("/gateways") || pathname?.startsWith("/gateways"),
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/settings",
      isActive: pathname === "/settings" || pathname === "/settings" || pathname?.startsWith("/settings"),
    },
  ];

  return (
    <>
      {isFloating && (
        <div className="w-[50px] shrink-0 h-full" />
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
          boxShadow: isHovering ? "4px 0 24px rgba(0,0,0,0.3)" : "none",
        } : undefined}
        className={`border-r border-border flex flex-col bg-sidebar shrink-0 h-full transition-all duration-300 ease-in-out overflow-hidden ${
          isFloating ? "" : "z-50"
        } ${isExpanded ? "w-[200px]" : "w-[50px]"}`}
      >
        <div className="flex flex-col h-full py-4">
          <TooltipProvider delayDuration={0}>
            <nav className="flex flex-col gap-1 px-2">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const button = (
                  <div
                    className={`flex items-center gap-3 rounded-lg px-2 h-8 cursor-pointer transition-all duration-200 group ${
                      item.isActive
                        ? "text-primary bg-primary/10 hover:bg-emerald-500/20"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span
                      className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                        isExpanded
                          ? "opacity-100 w-auto"
                          : "opacity-0 w-0 overflow-hidden"
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                );

                const wrapped = item.href ? (
                  <Link key={item.title} href={item.href}>
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

                return wrapped;
              })}
            </nav>
          </TooltipProvider>

          <div className="flex-1" />

          <div className="flex flex-col gap-2 px-2">
            <div className={`flex ${isExpanded ? "px-0.5" : "justify-center"}`}>
              <SidebarControl />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
