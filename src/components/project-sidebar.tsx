"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Network,
  BookOpen,
  Command,
  Users,
  Settings2
} from "lucide-react";

type MenuSection = {
  title: string;
  icon: React.ElementType;
  items: { title: string; url: string }[];
};

export function ProjectSidebar() {
  const pathname = usePathname();
  const parts = pathname?.split("/") || [];
  const orgId = parts[2];
  const projectId = parts[4];

  // If we are not inside a project, do not render this sidebar
  if (!projectId) return null;

  const baseUrl = `/org/${orgId}/project/${projectId}`;

  // Active Module Detection
  // Check exact match for Overview
  const isOverview = pathname === baseUrl || pathname === `${baseUrl}/`;
  
  if (isOverview) return null; // HIDDEN on Project Overview (Supabase style)

  // Map sub-modules
  let activeSection: MenuSection | null = null;
  let sectionTitle = "";

  if (pathname?.includes("/infrastructure")) {
    sectionTitle = "Infrastructure";
    activeSection = {
      title: "Infrastructure",
      icon: Network,
      items: [
        { title: "Topology View", url: `${baseUrl}/infrastructure/topology` },
        { title: "Heatmap", url: `${baseUrl}/infrastructure/heatmap` },
        { title: "Canvas Visual Builder", url: `${baseUrl}/infrastructure/canvas` },
      ],
    };
  } else if (pathname?.includes("/inventory")) {
    sectionTitle = "Network Inventory";
    activeSection = {
      title: "Network Inventory",
      icon: BookOpen,
      items: [
        { title: "ODC List", url: `${baseUrl}/inventory/odc` },
        { title: "ODP List", url: `${baseUrl}/inventory/odp` },
        { title: "Cable Management", url: `${baseUrl}/inventory/cables` }, // Doesn't exist physically yet but in UI
        { title: "Customer Database", url: `${baseUrl}/inventory/customer` },
      ],
    };
  } else if (pathname?.includes("/core")) {
    sectionTitle = "Core Infrastructure";
    activeSection = {
      title: "Core Infrastructure",
      icon: Command,
      items: [
        { title: "OLT Management", url: `${baseUrl}/core/olt` },
        { title: "Routers & Switches", url: `${baseUrl}/core/routers` },
        { title: "Servers & Services", url: `${baseUrl}/core/servers` },
      ],
    };
  } else if (pathname?.includes("/users")) {
    sectionTitle = "User Management";
    activeSection = {
      title: "User Management",
      icon: Users,
      items: [
        { title: "All Users", url: `${baseUrl}/users` },
        { title: "Roles & Permissions", url: `${baseUrl}/users/roles` },
      ],
    };
  } else if (pathname?.includes("/settings")) {
    sectionTitle = "Settings";
    activeSection = {
      title: "Settings",
      icon: Settings2,
      items: [
        { title: "General", url: `${baseUrl}/settings` },
        { title: "Team", url: `${baseUrl}/settings/team` },
      ],
    };
  } else {
    // Other pages that don't match any specific secondary sidebar
    return null;
  }

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-sidebar h-full hidden md:flex flex-col custom-scrollbar overflow-y-auto pt-6">
      <div className="px-5 mb-4">
        <h3 className="text-sm font-semibold text-sidebar-foreground">{sectionTitle}</h3>
      </div>
      <div className="flex-1 px-3 space-y-1">
        {activeSection.items.map((item, idx) => {
          const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
          return (
            <Link 
              key={idx} 
              href={item.url}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2 ${
                isActive 
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              {item.title}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
