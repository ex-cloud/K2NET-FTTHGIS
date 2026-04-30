"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Network,
  BookOpen,
  Command,
  Users,
  Settings2,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type MenuSection = {
  title: string;
  icon: React.ElementType;
  items: { title: string; url: string }[];
};

export function ProjectSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
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

  // ... (rest remains unchanged)
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
        {
          title: "Canvas Visual Builder",
          url: `${baseUrl}/infrastructure/canvas`,
        },
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
        { title: "BOQ Generator", url: `${baseUrl}/inventory/boq` }, // Phase 6
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
        { title: "Project Members", url: `${baseUrl}/settings/team` },
        { title: "GIS Data Import", url: `${baseUrl}/settings/import` }, // Phase 5
      ],
    };
  } else {
    // Other pages that don't match any specific secondary sidebar
    return null;
  }

  return (
    <div className="relative h-full flex shrink-0">
      <aside
        className={`${isCollapsed ? "w-0 border-r-0" : "w-[250px] border-r"} transition-all duration-300 ease-in-out shrink-0 border-border bg-sidebar h-full hidden md:flex flex-col overflow-hidden`}
      >
        {/* Title with Divider & Toggle */}
        <div className="py-4 border-b border-border/50 shrink-0 flex items-center justify-between px-5 min-w-[250px]">
          <h3 className="text-sm font-semibold text-sidebar-foreground truncate pr-2">
            {sectionTitle}
          </h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md hover:bg-muted text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors shrink-0"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4 min-w-[250px]">
          {/* Collapsible Menu Navigation */}
          <Collapsible defaultOpen className="w-full">
            <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider hover:text-sidebar-foreground group">
              <span>Menu</span>
              <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {activeSection.items.map((item, idx) => {
                const isActive =
                  pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <Link
                    key={idx}
                    href={item.url}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-2 ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </aside>

      {/* Floating Expand button when sidebar is collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute top-4 left-3 z-40 p-1.5 rounded-md bg-sidebar border border-border/50 shadow-[0_2px_10px_rgba(0,0,0,0.5)] hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-all duration-300"
          title="Expand sidebar"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
