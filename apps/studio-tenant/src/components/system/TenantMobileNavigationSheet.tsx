import * as React from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Search,
  HelpCircle,
  Sparkles,
  ClipboardList,
  MapPin,
  Menu,
} from "lucide-react";
import {
  MobileNavigationSheet,
  type MobileTabHeaderItem,
  type MobileTabId,
} from "@k2net/ui";
import { TenantCommandPaletteContent } from "../TenantCommandPalette";
import { TenantMobileHelpTab } from "./mobile-sheet/TenantMobileHelpTab";
import { TenantMobileAiTab } from "./mobile-sheet/TenantMobileAiTab";
import { TenantMobileTasksTab } from "./mobile-sheet/TenantMobileTasksTab";
import { TenantMobileGisTab } from "./mobile-sheet/TenantMobileGisTab";
import { TenantMobileMenuTab } from "./mobile-sheet/TenantMobileMenuTab";

export type TenantMobileTab = "search" | "help" | "ai" | "tasks" | "gis" | "menu";

const TENANT_TABS: MobileTabHeaderItem[] = [
  { id: "search", title: "Cari perintah & aset (⌘K)", icon: Search },
  { id: "help", title: "Bantuan & Panduan SOP", icon: HelpCircle },
  { id: "ai", title: "Ask AI Copilot (Ctrl+J)", icon: Sparkles },
  { id: "tasks", title: "Notifikasi & Tiket Gangguan", icon: ClipboardList, badgeCount: 3 },
  { id: "gis", title: "Peta Spasial GIS", icon: MapPin },
  { id: "menu", title: "Menu Navigasi", icon: Menu, variant: "primary" },
];

export interface TenantMobileNavigationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab?: MobileTabId;
  onTabChange?: (tab: MobileTabId) => void;
  projectId?: string;
  trigger?: React.ReactNode;
}

export function TenantMobileNavigationSheet({
  open,
  onOpenChange,
  activeTab: controlledTab,
  onTabChange,
  projectId,
  trigger,
}: TenantMobileNavigationSheetProps) {
  const routerState = useRouterState();
  const navigate = useNavigate();
  const pathname = routerState.location.pathname;

  const [internalTab, setInternalTab] = React.useState<TenantMobileTab>("menu");
  const activeTab = (controlledTab as TenantMobileTab) ?? internalTab;

  const [searchQuery, setSearchQuery] = React.useState("");

  const handleTabSelect = (tabId: MobileTabId) => {
    const castedTab = tabId as TenantMobileTab;
    if (onTabChange) onTabChange(castedTab);
    setInternalTab(castedTab);
  };

  const handleNavigate = (url: string) => {
    onOpenChange(false);
    navigate({ to: url as never });
  };

  const handleSearchSelectAction = (action: () => void) => {
    onOpenChange(false);
    setSearchQuery("");
    action();
  };

  return (
    <MobileNavigationSheet
      open={open}
      onOpenChange={onOpenChange}
      activeTab={activeTab}
      onTabChange={handleTabSelect}
      tabs={TENANT_TABS}
      trigger={trigger}
    >
      {/* TAB 1: EMBEDDED SEARCH & COMMAND PALETTE */}
      {activeTab === "search" && (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in-0 duration-200">
          <TenantCommandPaletteContent
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onSelectAction={handleSearchSelectAction}
            onOpenAi={() => handleTabSelect("ai")}
            onOpenHelp={() => handleTabSelect("help")}
            projectId={projectId}
            className="h-full"
          />
        </div>
      )}

      {/* TAB 2: HELP & SUPPORT GUIDE */}
      {activeTab === "help" && (
        <TenantMobileHelpTab
          onNavigate={handleNavigate}
          onOpenAi={() => handleTabSelect("ai")}
          projectId={projectId}
        />
      )}

      {/* TAB 3: ASK AI ASSISTANT */}
      {activeTab === "ai" && (
        <TenantMobileAiTab onClose={() => onOpenChange(false)} />
      )}

      {/* TAB 4: TASKS & NOTIFICATIONS */}
      {activeTab === "tasks" && (
        <TenantMobileTasksTab
          projectId={projectId}
          onNavigate={handleNavigate}
          onClose={() => onOpenChange(false)}
        />
      )}

      {/* TAB 5: GIS SPATIAL DIAGNOSTICS & TOOLS */}
      {activeTab === "gis" && (
        <TenantMobileGisTab
          projectId={projectId}
          onNavigate={handleNavigate}
          onClose={() => onOpenChange(false)}
        />
      )}

      {/* TAB 6: NAVIGATION MENU (Level 1 Primary <-> Level 2 Secondary) */}
      {activeTab === "menu" && (
        <TenantMobileMenuTab
          pathname={pathname}
          projectId={projectId}
          onNavigate={handleNavigate}
          onClose={() => onOpenChange(false)}
        />
      )}
    </MobileNavigationSheet>
  );
}
