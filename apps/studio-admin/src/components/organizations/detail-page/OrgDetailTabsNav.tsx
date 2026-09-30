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
import { useTranslation, type TranslationKey } from "@k2net/i18n";
import { cn } from "@/lib/utils";
import type { DetailTab } from "./types";

interface OrgDetailTabsNavProps {
  activeTab: DetailTab;
  setActiveTab: (tab: DetailTab) => void;
}

interface TabDef {
  id: DetailTab;
  labelKey: TranslationKey;
  icon: React.ElementType;
}

const TABS: TabDef[] = [
  { id: "overview", labelKey: "organizations.tab_overview", icon: Activity },
  { id: "hardware", labelKey: "organizations.tab_hardware", icon: Network },
  { id: "network", labelKey: "organizations.tab_network", icon: Globe },
  { id: "team", labelKey: "organizations.tab_team", icon: Users },
  { id: "documents", labelKey: "organizations.tab_documents", icon: FileText },
  { id: "api", labelKey: "organizations.tab_api", icon: Webhook },
  { id: "backups", labelKey: "organizations.tab_data", icon: Database },
  { id: "billing", labelKey: "organizations.tab_billing", icon: CreditCard },
  { id: "audit", labelKey: "organizations.tab_audit", icon: History },
  { id: "danger", labelKey: "organizations.tab_danger", icon: ShieldAlert },
];

export function OrgDetailTabsNav({ activeTab, setActiveTab }: OrgDetailTabsNavProps) {
  const { t } = useTranslation();

  return (
    <div className="px-6 border-b border-border/40 shrink-0 bg-background/50 flex items-center gap-1 overflow-x-auto custom-scrollbar">
      {TABS.map((tab, idx) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const shortcutKey = idx === 9 ? "0" : `${idx + 1}`;
        const label = t(tab.labelKey);

        return (
          <ActionTooltip key={tab.id} label={`${label} (${shortcutKey})`}>
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
              <span>{label}</span>
            </button>
          </ActionTooltip>
        );
      })}
    </div>
  );
}
