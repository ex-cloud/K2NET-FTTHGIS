import * as React from "react";
import { ActionTooltip } from "@k2net/ui";
import {
  Activity,
  Network,
  Globe,
  Users,
  FileText,
  Webhook,
  Database,
  CreditCard,
  History,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DetailTab } from "./types";

interface OrgDetailTabsNavProps {
  activeTab: DetailTab;
  setActiveTab: (tab: DetailTab) => void;
}

const TABS = [
  { id: "overview" as DetailTab, label: "Overview", icon: Activity },
  { id: "hardware" as DetailTab, label: "Hardware & OLTs", icon: Network },
  { id: "network" as DetailTab, label: "Network & VPN", icon: Globe },
  { id: "team" as DetailTab, label: "Team & Access", icon: Users },
  { id: "documents" as DetailTab, label: "Documents & Legal", icon: FileText },
  { id: "api" as DetailTab, label: "API & Webhooks", icon: Webhook },
  { id: "backups" as DetailTab, label: "Data & Backups", icon: Database },
  { id: "billing" as DetailTab, label: "Billing", icon: CreditCard },
  { id: "audit" as DetailTab, label: "Audit & Logs", icon: History },
  { id: "danger" as DetailTab, label: "Danger Zone", icon: ShieldAlert },
];

export function OrgDetailTabsNav({ activeTab, setActiveTab }: OrgDetailTabsNavProps) {
  return (
    <div className="px-6 border-b border-border/40 shrink-0 bg-background/50 flex items-center gap-1 overflow-x-auto custom-scrollbar">
      {TABS.map((tab, idx) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const shortcutKey = idx === 9 ? "0" : `${idx + 1}`;
        return (
          <ActionTooltip key={tab.id} label={`${tab.label} (Tekan ${shortcutKey})`}>
            <button
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 transition-all shrink-0 cursor-pointer",
                isActive
                  ? tab.id === "danger"
                    ? "border-destructive text-destructive font-semibold"
                    : "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          </ActionTooltip>
        );
      })}
    </div>
  );
}
