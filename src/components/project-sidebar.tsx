"use client";

import * as React from "react";
import {
  Users,
  Settings,
  Activity,
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Plug,
  Boxes,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { SidebarControl } from "@/components/sidebar-control";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { useSidebarMode } from "@/components/sidebar-mode-context";

export function ProjectSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { sidebarMode } = useSidebarMode();
  const { setOpen, state } = useSidebar();

  const handleMouseEnter = () => {
    if (sidebarMode === "hover" && state === "collapsed") setOpen(true);
  };

  const handleMouseLeave = () => {
    if (sidebarMode === "hover" && state === "expanded") setOpen(false);
  };

  const parts = pathname?.split("/") || [];
  const orgId = parts[2];
  const projectId = parts[4];
  const baseUrl = `/org/${orgId}/project/${projectId}`;

  // Determine which menu set to show
  const isAuth = pathname?.includes("/auth");
  const isDatabase = pathname?.includes("/database");
  const isOrgLevel = !projectId;

  return (
    <Sidebar
      collapsible="icon"
      className="bg-sidebar border-r border-sidebar-border z-30 transition-all duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <SidebarHeader className="border-b border-sidebar-border h-12 flex items-center px-4 bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-emerald-600/20 border border-emerald-500/30">
          <div
            className="h-2.5 w-2.5 bg-emerald-500"
            style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
          />
        </div>
        <div className="font-medium text-xs text-sidebar-foreground tracking-tight w-full truncate group-data-[collapsible=icon]:hidden">
          {isOrgLevel
            ? "Organization"
            : isAuth
              ? "Authentication"
              : isDatabase
                ? "Database"
                : "Home"}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent px-2 py-4 space-y-4">
        {/* Global Navigation - Always Visible */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] font-bold uppercase tracking-widest px-2 mb-2 group-data-[collapsible=icon]:hidden">
            Organization
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === `/org/${orgId}`}
                tooltip="Projects"
              >
                <a href={`/org/${orgId}`}>
                  <Boxes className="size-4" />
                  <span className="text-sm font-medium">Projects</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname?.includes("/team")}
                tooltip="Team"
              >
                <a href={`/org/${orgId}/team`}>
                  <Users className="size-4" />
                  <span className="text-sm font-medium">Team</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Integrations">
                <Plug className="size-4" />
                <span className="text-sm font-medium">Integrations</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Contextual Navigation */}
        <div className="pt-2 border-t border-sidebar-border/50">
          {isOrgLevel ? (
            <SidebarGroup className="p-0 pt-2">
              <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] font-bold uppercase tracking-widest px-2 mb-2 group-data-[collapsible=icon]:hidden">
                Management
              </SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Usage">
                    <BarChart3 className="size-4" />
                    <span className="text-sm font-medium">Usage</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Billing">
                    <CreditCard className="size-4" />
                    <span className="text-sm font-medium">Billing</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Settings">
                    <Settings className="size-4" />
                    <span className="text-sm font-medium">Org Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          ) : isAuth ? (
            <SidebarGroup className="p-0 pt-2">
              <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] font-bold uppercase tracking-widest px-2 mb-2 group-data-[collapsible=icon]:hidden">
                Authentication
              </SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname?.includes("/users")}
                    tooltip="Users"
                  >
                    <Users className="size-4" />
                    <span className="text-sm font-medium">Users</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {/* ... other auth items can go here */}
              </SidebarMenu>
            </SidebarGroup>
          ) : (
            <SidebarGroup className="p-0 pt-2">
              <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] font-bold uppercase tracking-widest px-2 mb-2 group-data-[collapsible=icon]:hidden">
                Project Content
              </SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === baseUrl}
                    tooltip="Overview"
                  >
                    <a href={baseUrl}>
                      <LayoutDashboard className="size-4" />
                      <span className="text-sm font-medium">Overview</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Monitoring">
                    <Activity className="size-4" />
                    <span className="text-sm font-medium">Monitoring</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Project Settings">
                    <Settings className="size-4" />
                    <span className="text-sm font-medium">
                      Project Settings
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 bg-sidebar/50">
        <div className="flex flex-col gap-2">
          <SidebarControl />

          {/* <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="hover:bg-sidebar-accent group">
                <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent/50 border border-sidebar-border text-[10px] font-bold text-sidebar-foreground/70 group-hover:border-sidebar-foreground/20 transition-colors">
                  JD
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold text-sidebar-foreground">
                    John Doe
                  </span>
                  <span className="truncate text-xs text-zinc-500">
                    john@example.com
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu> */}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
