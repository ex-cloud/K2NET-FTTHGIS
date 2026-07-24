"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@k2net/ui";
import { SYSTEM_SIDEBAR_NAVIGATION } from "@/config/system-sidebar-navigation";

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
};

export function SystemSecondarySidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Determine active config key based on URL pathname
  let activeKey: string | null = null;
  if (pathname?.includes("/users")) {
    activeKey = "users";
  } else if (pathname?.includes("/security")) {
    activeKey = "security";
  } else if (pathname?.includes("/gateways")) {
    activeKey = "gateways";
  }

  if (!activeKey) return null;

  const currentConfig = SYSTEM_SIDEBAR_NAVIGATION[activeKey];
  if (!currentConfig) return null;

  return (
    <div className="relative h-full flex shrink-0">
      <aside
        className={`${isCollapsed ? "w-0 border-r-0" : "w-[240px] border-r"} transition-all duration-300 ease-in-out shrink-0 border-border bg-sidebar h-full hidden md:flex flex-col overflow-hidden`}
      >
        {/* Title with Toggle */}
        <div className="py-5 border-b border-border/40 shrink-0 flex items-center justify-between px-5 min-w-[240px]">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            {currentConfig.title}
          </h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6 min-w-[240px]">
          {currentConfig.sections.map((section, sIdx) => (
            <Collapsible key={sIdx} defaultOpen className="w-full">
              <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
                <span>{section.title}</span>
                <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 mt-2">
                {section.items.map((item, idx) => {
                  const isActive = pathname === item.url || pathname === `/system${item.url}`;
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
