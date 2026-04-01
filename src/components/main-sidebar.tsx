"use client";

import * as React from "react";
import {
  Settings,
  LayoutGrid,
  Users,
  Plug,
  BarChart3,
  CreditCard,
  Home,
  Network,
  Map as MapIcon,
  Cpu,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useSidebarMode } from "./sidebar-mode-context";
import { SidebarControl } from "./sidebar-control";

type NavItem = {
  title: string;
  icon: React.ElementType;
  href: string | null;
  isActive?: boolean;
};

export function MainSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const orgId = params.orgId || "default";
  const { sidebarMode } = useSidebarMode();
  const [isHovering, setIsHovering] = React.useState(false);

  // Route sniffing — detect project context
  const isInsideProject = pathname?.includes("/project/");
  const match = pathname?.match(/\/org\/([^\/]+)(?:\/project\/([^\/]+))?/);
  const projectId = match && match[2] ? match[2] : "";

  // Determine visual expansion
  const isExpanded =
    sidebarMode === "expanded" || (sidebarMode === "hover" && isHovering);

  // Hover mode uses absolute positioning (floating over content, Supabase-style)
  const isFloating = sidebarMode === "hover";

  // ── Org-level navigation ──
  const orgNavItems: NavItem[] = [
    {
      title: "Projects",
      icon: LayoutGrid,
      href: `/org/${orgId}`,
      isActive: pathname === `/org/${orgId}` || pathname === `/org/${orgId}/`,
    },
    {
      title: "Team",
      icon: Users,
      href: `/org/${orgId}/team`,
      isActive: pathname?.includes("/team"),
    },
    {
      title: "Integrations",
      icon: Plug,
      href: null,
    },
    {
      title: "Usage",
      icon: BarChart3,
      href: null,
    },
    {
      title: "Billing",
      icon: CreditCard,
      href: null,
    },
    {
      title: "Settings",
      icon: Settings,
      href: null,
    },
  ];

  // ── Project-level navigation ──
  const projectNavItems: NavItem[] = [
    {
      title: "Project Overview",
      icon: Home,
      href: `/org/${orgId}/project/${projectId}`,
      isActive: pathname === `/org/${orgId}/project/${projectId}` || pathname === `/org/${orgId}/project/${projectId}/`,
    },
    {
      title: "Infrastructure",
      icon: Network,
      href: `/org/${orgId}/project/${projectId}/infrastructure`,
      isActive: pathname?.includes("/infrastructure"),
    },
    {
      title: "Network Inventory",
      icon: MapIcon,
      href: `/org/${orgId}/project/${projectId}/inventory`,
      isActive: pathname?.includes("/inventory"),
    },
    {
      title: "Core Infrastructure",
      icon: Cpu,
      href: `/org/${orgId}/project/${projectId}/core`,
      isActive: pathname?.includes("/core"),
    },
    {
      title: "Settings",
      icon: Settings,
      href: `/org/${orgId}/project/${projectId}/settings`,
      isActive: pathname?.includes("/settings") && isInsideProject,
    },
  ];

  // Dynamic nav items based on current route context
  const navItems = isInsideProject ? projectNavItems : orgNavItems;

  return (
    <>
      {/* 
        Spacer: Only in hover mode — the sidebar is absolutely positioned,
        so this invisible div reserves 50px to prevent content from going under it.
        Expanded & Collapsed modes use normal flow (no spacer needed).
      */}
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
        className={`border-r border-white/5 flex flex-col bg-sidebar shrink-0 h-full transition-all duration-300 ease-in-out overflow-hidden ${
          isFloating ? "" : "z-50"
        } ${isExpanded ? "w-[200px]" : "w-[50px]"}`}
      >
        <div className="flex flex-col h-full py-4">
          {/* Top Navigation */}
          <TooltipProvider delayDuration={0}>
            <nav className="flex flex-col gap-1 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const button = (
                  <div
                    className={`flex items-center gap-3 rounded-lg px-2 h-8 cursor-pointer transition-all duration-200 group ${
                      item.isActive
                        ? "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
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

                // Only show tooltip when collapsed
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

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom Section */}
          <div className="flex flex-col gap-2 px-2">
            {/* Sidebar Mode Control */}
            <div className={`flex ${isExpanded ? "px-0.5" : "justify-center"}`}>
              <SidebarControl />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
