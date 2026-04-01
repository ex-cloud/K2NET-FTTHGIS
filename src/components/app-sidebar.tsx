"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Settings2,
  Home,
  Network,
  Cpu,
  Map as MapIcon,
  Users,
  CreditCard,
  Briefcase,
  Hexagon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { useSidebarMode } from "./sidebar-mode-context";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { sidebarMode, setOpen: setContextOpen } = useSidebarMode();

  // Route sniffing
  const isInsideProject = pathname?.includes("/project/");

  // Extract orgId and projectId from URL pattern: /org/[orgId]/project/[projectId]
  const match = pathname?.match(/\/org\/([^\/]+)(?:\/project\/([^\/]+))?/);
  const orgId = match ? match[1] : "default";
  const projectId = match && match[2] ? match[2] : "";

  // Auto-collapse logic removed to give full control to the 3-mode switcher.

  // Dynamic Navigation Models
  const orgNavMain = [
    {
      title: "Projects",
      url: `/org/${orgId}`,
      icon: Briefcase,
      isActive: !isInsideProject,
    },
    {
      title: "Team",
      url: "#",
      icon: Users,
    },
    {
      title: "Billing",
      url: "#",
      icon: CreditCard,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
    },
  ];

  const projectNavMain = [
    {
      title: "Project Overview",
      url: `/org/${orgId}/project/${projectId}`,
      icon: Home,
      isActive: pathname === `/org/${orgId}/project/${projectId}`,
    },
    {
      title: "Infrastructure",
      url: `/org/${orgId}/project/${projectId}/infrastructure`,
      icon: Network,
      isActive: pathname?.includes("/infrastructure"),
    },
    {
      title: "Network Inventory",
      url: `/org/${orgId}/project/${projectId}/inventory`,
      icon: MapIcon,
      isActive: pathname?.includes("/inventory"),
    },
    {
      title: "Core Infrastructure",
      url: `/org/${orgId}/project/${projectId}/core`,
      icon: Cpu,
      isActive: pathname?.includes("/core"),
    },
    {
      title: "Settings",
      url: `/org/${orgId}/project/${projectId}/settings`,
      icon: Settings2,
      isActive: pathname?.includes("/settings"),
    },
  ];

  const currentNav = isInsideProject ? projectNavMain : orgNavMain;

  // Render Session User
  const user = session?.user
    ? {
        name: session.user.name || "User",
        email: session.user.email || "user@example.com",
        avatar: session.user.image || "/avatars/shadcn.jpg",
      }
    : {
        name: "User",
        email: "user@example.com",
        avatar: "/avatars/shadcn.jpg",
      };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-white/5 bg-sidebar transition-all duration-300 ease-in-out"
      onMouseEnter={() => {
        if (sidebarMode === "hover") setContextOpen(true);
      }}
      onMouseLeave={() => {
        if (sidebarMode === "hover") setContextOpen(false);
      }}
      {...props}
    >
      <SidebarHeader className="h-16 border-b border-white/5 flex flex-row items-center px-4">
        <div className="flex flex-row items-center overflow-hidden">
          <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Hexagon className="size-4 fill-emerald-500/20" />
          </div>
          <div className="ml-3 flex flex-col gap-0.5 leading-none transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 overflow-hidden">
            <span className="font-bold text-sm tracking-tight truncate">
              ex-cloud&apos;s Org
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-500/70 truncate">
              Free Plan
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="py-4">
        <NavMain items={currentNav} />
      </SidebarContent>
      <SidebarFooter className="border-t border-white/5 p-2">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail className="hover:after:bg-emerald-500/20" />
    </Sidebar>
  );
}
