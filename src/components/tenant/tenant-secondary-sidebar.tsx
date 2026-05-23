"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Settings2,
  Blocks,
  BarChart3,
  CreditCard,
  ShieldCheck,
  Fingerprint,
  Share2,
  History,
  FileText,
  Users,
  UserPlus,
  UserCog,
  Mail,
  Network,
  Map,
  LayoutGrid,
  BookOpen,
  GitCommit,
  Calculator,
  Cpu,
  Server,
  FileUp,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TENANT_SIDEBAR_NAVIGATION } from "@/config/tenant-sidebar-navigation";
import { getCurrentOrgSlug } from "@/lib/domain";

const iconMap: Record<string, React.ElementType> = {
  Settings2,
  Blocks,
  BarChart3,
  CreditCard,
  ShieldCheck,
  Fingerprint,
  Share2,
  History,
  FileText,
  Users,
  UserPlus,
  UserCog,
  Mail,
  Network,
  Map,
  LayoutGrid,
  BookOpen,
  GitCommit,
  Calculator,
  Cpu,
  Server,
  FileUp,
};

export function TenantSecondarySidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);


  // 1. Detect subdomain context
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isSystemSubdomain = hostname.startsWith("system.") || hostname.startsWith("system-");
  const tenantSlug = getCurrentOrgSlug();

  // 2. Extract IDs based on context
  const parts = pathname?.split("/").filter(Boolean) || [];
  let orgId = "";
  let projectId = "";

  if (tenantSlug) {
    // Clean URL on subdomain: /project/[projectId]/...
    if (parts[0] === "project") {
      projectId = parts[1];
    }
  } else {
    // Legacy URL on root domain: /org/[orgId]/project/[projectId]/...
    if (parts[0] === "org") {
      orgId = parts[1];
      if (parts[2] === "project") {
        projectId = parts[3];
      }
    }
  }

  // 3. Determine active module & baseUrl
  let activeModuleKey: string | null = null;
  let baseUrl = "";

  if (projectId) {
    baseUrl = tenantSlug ? `/project/${projectId}` : `/org/${orgId}/project/${projectId}`;
    
    // Check exact match for Overview
    const isOverview = pathname === baseUrl || pathname === `${baseUrl}/`;
    if (isOverview) return null; // HIDDEN on Project Overview (Supabase style)

    if (pathname?.includes("/infrastructure")) activeModuleKey = "project-infrastructure";
    else if (pathname?.includes("/inventory")) activeModuleKey = "project-inventory";
    else if (pathname?.includes("/core")) activeModuleKey = "project-core";
    else if (pathname?.includes("/users")) activeModuleKey = "project-users";
    else if (pathname?.includes("/settings")) activeModuleKey = "project-settings";
  } else {
    // Org level modules
    if (pathname?.includes("/settings")) {
      activeModuleKey = "settings";
      baseUrl = tenantSlug ? "/settings" : `/org/${orgId}/settings`;
    } else if (pathname?.includes("/team")) {
      activeModuleKey = "team";
      baseUrl = tenantSlug ? "/team" : `/org/${orgId}/team`;
    }
  }

  if (!activeModuleKey || !TENANT_SIDEBAR_NAVIGATION[activeModuleKey]) {
    return null;
  }

  const activeConfig = TENANT_SIDEBAR_NAVIGATION[activeModuleKey];

  return (
    <div className="relative h-full flex shrink-0">
      <aside
        className={`${isCollapsed ? "w-0 border-r-0" : "w-[240px] border-r"} transition-all duration-300 ease-in-out shrink-0 border-border bg-[#0c0c0c] h-full hidden md:flex flex-col overflow-hidden`}
      >
        {/* Title with Toggle */}
        <div className="py-5 border-b border-border/40 shrink-0 flex items-center justify-between px-5 min-w-[240px]">
          <h3 className="text-sm font-semibold text-zinc-100 tracking-tight truncate pr-2">
            {activeConfig.title}
          </h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-100 transition-colors shrink-0"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6 min-w-[240px]">
          {activeConfig.sections.map((section, sIdx) => (
            <Collapsible key={sIdx} defaultOpen className="w-full">
              <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-300 group">
                <span>{section.title}</span>
                <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 mt-2">
                {section.items.map((item, idx) => {
                  const itemUrl = item.url ? `${baseUrl}${item.url}` : baseUrl;
                  // For items with no sub-path (url=""), use exact match only
                  // to prevent General from being active on /billing, /integrations, etc.
                  const isActive = item.url
                    ? (pathname === itemUrl || pathname?.startsWith(`${itemUrl}/`))
                    : pathname === itemUrl;
                  const Icon = iconMap[item.icon] || Settings2;
                  return (
                    <Link
                      key={idx}
                      href={itemUrl}
                      onClick={(e) => { if (isActive) e.preventDefault(); }}
                      className={`px-2.5 py-1.5 text-xs rounded-md transition-all flex items-center gap-2.5 ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-500 font-medium border border-emerald-500/20"
                          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-500" : "text-zinc-500"}`} />
                      {item.title}
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </aside>

      {/* Floating Expand button when sidebar is collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute top-4 left-3 z-40 p-1.5 rounded-md bg-zinc-900 border border-zinc-800 shadow-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all duration-300"
          title="Expand sidebar"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
