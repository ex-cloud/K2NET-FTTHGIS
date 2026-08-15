"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  History,
  UserCog,
  KeyRound,
  Fingerprint,
  FileText,
  ScrollText,
  ShieldAlert,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3,
  MessageSquare,
  CreditCard,
  Map,
  Database,
  MessageCircle,
  Clock,
  Download,
  Network,
  Activity,
  LayoutDashboard,
  DatabaseZap,
  Globe,
  Server,
  Radio,
  Wrench,
  Sliders,
  MapPin,
  Palette,
  Mail,
  CalendarClock,
  ClipboardList,
  Inbox,
  UserX,
  CheckCircle,
  Plus,
  FolderKanban,
  Cpu,
  Building2,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@k2net/ui";
import { SYSTEM_SIDEBAR_NAVIGATION } from "@/config/system-sidebar-navigation";
import { LogsFilterSidebar } from "@/components/logs/logs-filter-sidebar";
import { useLogsFilter } from "@/components/logs/logs-filter-context";

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  ShieldCheck,
  History,
  UserCog,
  KeyRound,
  Fingerprint,
  FileText,
  ScrollText,
  ShieldAlert,
  BarChart3,
  MessageSquare,
  CreditCard,
  Map,
  Database,
  MessageCircle,
  Clock,
  Download,
  Network,
  Activity,
  LayoutDashboard,
  DatabaseZap,
  Globe,
  Server,
  Radio,
  Wrench,
  Sliders,
  MapPin,
  Palette,
  Mail,
  CalendarClock,
  ClipboardList,
  Inbox,
  UserX,
  CheckCircle,
  Plus,
  FolderKanban,
  Cpu,
  Building2,
};

export function SystemSecondarySidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // For the logs page, sync collapse state with the shared LogsFilter context
  // so the PanelLeft button in LogsTopHeader can also toggle the sidebar.
  const { isSidebarCollapsed: ctxCollapsed, setIsSidebarCollapsed: ctxSetCollapsed } =
    useLogsFilter();

  // Determine active config key based on URL pathname
  let activeKey: string | null = null;
  if (pathname?.includes("/users")) {
    activeKey = "users";
  } else if (pathname?.includes("/security")) {
    activeKey = "security";
  } else if (pathname?.includes("/gateways")) {
    activeKey = "gateways";
  } else if (pathname?.includes("/observability")) {
    activeKey = "observability";
  } else if (pathname?.includes("/settings")) {
    activeKey = "settings";
  } else if (pathname?.includes("/logs")) {
    activeKey = "logs";
  } else if (pathname?.startsWith("/tasks")) {
    activeKey = "tasks";
  }

  if (!activeKey) return null;

  const isLogsPage = activeKey === "logs";
  const currentConfig = SYSTEM_SIDEBAR_NAVIGATION[activeKey];
  if (!currentConfig && !isLogsPage) return null;

  // When on logs page: use shared context state so PanelLeft in the top header
  // (which calls setIsSidebarCollapsed from context) is in sync with this sidebar.
  const effectiveCollapsed = isLogsPage ? ctxCollapsed : isCollapsed;
  const handleCollapse = isLogsPage
    ? () => ctxSetCollapsed((prev) => !prev)
    : () => setIsCollapsed(!isCollapsed);

  return (
    <div className="relative h-full flex shrink-0">
      <aside
        className={`${effectiveCollapsed ? "w-0 border-r-0" : "w-[240px] border-r"} transition-all duration-300 ease-in-out shrink-0 border-border bg-sidebar h-full hidden md:flex flex-col overflow-hidden`}
      >
        {isLogsPage ? (
          <LogsFilterSidebar onCollapse={handleCollapse} />
        ) : (
          <>
            {/* Title with Toggle */}
            <div className="py-5 border-b border-border/40 shrink-0 flex items-center justify-between px-5 min-w-[240px]">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                {currentConfig?.title}
              </h3>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6 min-w-[240px]">
              {currentConfig?.sections.map((section, sIdx) => (
                <Collapsible key={sIdx} defaultOpen className="w-full">
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
                    <span>{section.title}</span>
                    <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-0.5 mt-2">
                    {section.items.map((item, idx) => {
                      // Support query-param-based active detection (e.g. /tasks?quick=active)
                      let isActive: boolean;
                      if (item.url.includes("?")) {
                        const [itemPath, itemSearch] = item.url.split("?");
                        const itemParams = new URLSearchParams(itemSearch);
                        const pathMatch =
                          pathname === itemPath ||
                          pathname === `/system${itemPath}`;
                        isActive =
                          pathMatch &&
                          Array.from(itemParams.entries()).every(
                            ([k, v]) => searchParams.get(k) === v
                          );
                      } else {
                        // No query params: only active if we're on this exact path
                        // AND no task-specific filter params are active
                        const pathMatch =
                          pathname === item.url ||
                          pathname === `/system${item.url}`;
                        const hasTaskFilter =
                          searchParams.has("quick") || searchParams.has("scope");
                        // For /tasks (All Issues), only active when no filters applied
                        isActive =
                          pathMatch &&
                          (item.url.startsWith("/tasks") ? !hasTaskFilter : true);
                      }
                      const Icon = ICON_MAP[item.icon] || FileText;
                      return (
                        <Link
                          key={idx}
                          href={item.url}
                          className={`px-2.5 py-1.5 text-xs rounded-md transition-all flex items-center gap-2.5 ${
                            isActive
                              ? "bg-sidebar-accent text-foreground font-semibold border border-border/40"
                              : "text-foreground/85 dark:text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium"
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isActive ? "text-foreground" : "text-foreground/70 dark:text-muted-foreground"}`} />
                          {item.title}
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </>
        )}
      </aside>

      {/* Floating Expand button when sidebar is collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute top-4 left-3 z-40 p-1.5 rounded-md bg-muted border border-border shadow-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-300"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
