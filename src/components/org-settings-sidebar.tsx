"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Settings2,
  ShieldCheck,
  Fingerprint,
  Share2,
  FileText,
  History,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Blocks,
  CreditCard,
  BarChart3,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type MenuSection = {
  title: string;
  items: { title: string; url: string; icon: React.ElementType }[];
};

export function OrgSettingsSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const parts = pathname?.split("/") || [];
  const orgId = parts[2];

  if (!pathname?.includes("/settings")) return null;

  const baseUrl = `/org/${orgId}/settings`;

  const sections: MenuSection[] = [
    {
      title: "Configuration",
      items: [
        { title: "General", url: `${baseUrl}`, icon: Settings2 },
        { title: "Integrations", url: `${baseUrl}/integrations`, icon: Blocks },
        { title: "Usage Stats", url: `${baseUrl}/usage`, icon: BarChart3 },
        { title: "Billing & Plans", url: `${baseUrl}/billing`, icon: CreditCard },
      ],
    },
    {
      title: "Security",
      items: [
        { title: "Security", url: `${baseUrl}/security`, icon: ShieldCheck },
        { title: "SSO", url: `${baseUrl}/sso`, icon: Fingerprint },
      ],
    },
    {
      title: "Connections",
      items: [
        { title: "OAuth Apps", url: `${baseUrl}/oauth`, icon: Share2 },
      ],
    },
    {
      title: "Compliance",
      items: [
        { title: "Audit Logs", url: `${baseUrl}/audit`, icon: History },
        { title: "Legal Documents", url: `${baseUrl}/legal`, icon: FileText },
      ],
    },
  ];

  return (
    <div className="relative h-full flex shrink-0">
      <aside
        className={`${isCollapsed ? "w-0 border-r-0" : "w-[240px] border-r"} transition-all duration-300 ease-in-out shrink-0 border-border bg-[#0c0c0c] h-full hidden md:flex flex-col overflow-hidden`}
      >
        {/* Title with Toggle */}
        <div className="py-5 border-b border-border/40 shrink-0 flex items-center justify-between px-5 min-w-[240px]">
          <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">
            Settings
          </h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-100 transition-colors shrink-0"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6 min-w-[240px]">
          {sections.map((section, sIdx) => (
            <Collapsible key={sIdx} defaultOpen className="w-full">
              <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-300 group">
                <span>{section.title}</span>
                <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 mt-2">
                {section.items.map((item, idx) => {
                  const isActive = pathname === item.url;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={idx}
                      href={item.url}
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
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
