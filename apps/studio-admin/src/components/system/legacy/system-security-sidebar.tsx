

import * as React from "react";
import { usePathname } from "@/lib/navigation-compat";
import { Link } from "@/lib/navigation-compat";
import {
  ShieldCheck,
  UserCog,
  KeyRound,
  Fingerprint,
  History,
  FileText,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  ShieldAlert,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@k2net/ui";

type MenuSection = {
  title: string;
  items: { title: string; url: string; icon: React.ElementType }[];
};

export function SystemSecuritySidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  if (!pathname?.includes("/security") && !pathname?.includes("/security")) return null;

  const sections: MenuSection[] = [
    {
      title: "Access Control",
      items: [
        { title: "Role Templates", url: "/security/roles", icon: UserCog },
        { title: "Permissions", url: "/security/permissions", icon: KeyRound },
      ],
    },
    {
      title: "Identity & Auth",
      items: [
        { title: "Authentication", url: "/security/auth", icon: ShieldCheck },
        { title: "SSO Providers", url: "/security/sso", icon: Fingerprint },
      ],
    },
    {
      title: "Monitoring",
      items: [
        { title: "Audit Logs", url: "/security/audit", icon: History },
        { title: "Security Alerts", url: "/security/alerts", icon: ShieldAlert },
      ],
    },
    {
      title: "Policies",
      items: [
        { title: "Password Policy", url: "/security/password-policy", icon: ScrollText },
        { title: "Compliance", url: "/security/compliance", icon: FileText },
      ],
    },
  ];

  return (
    <div className="relative h-full flex shrink-0">
      <aside
        className={`${isCollapsed ? "w-0 border-r-0" : "w-[240px] border-r"} transition-all duration-300 ease-in-out shrink-0 border-border bg-sidebar h-full hidden md:flex flex-col overflow-hidden`}
      >
        {/* Title with Toggle */}
        <div className="py-5 border-b border-border/40 shrink-0 flex items-center justify-between px-5 min-w-[240px]">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            Security Settings
          </h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6 min-w-[240px]">
          {sections.map((section, sIdx) => (
            <Collapsible key={sIdx} defaultOpen className="w-full">
              <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-muted-foreground group">
                <span>{section.title}</span>
                <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 mt-2">
                {section.items.map((item, idx) => {
                  const isActive = pathname === item.url || pathname === `/system${item.url}`;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={idx}
                      href={item.url}
                      className={`px-2.5 py-1.5 text-xs rounded-md transition-all flex items-center gap-2.5 ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium border border-primary/20"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
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
