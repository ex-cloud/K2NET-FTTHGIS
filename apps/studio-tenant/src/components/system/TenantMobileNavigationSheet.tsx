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
import { TenantMobileMenuTab } from "./mobile-sheet/TenantMobileMenuTab";
import { TenantMobileTasksTab } from "./mobile-sheet/TenantMobileTasksTab";
import { TenantMobileGisTab } from "./mobile-sheet/TenantMobileGisTab";

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
  onOpenCommandPalette: () => void;
  onOpenAi: () => void;
  onOpenHelp: () => void;
  projectId?: string;
}

export function TenantMobileNavigationSheet({
  open,
  onOpenChange,
  activeTab = "menu",
  onTabChange,
  onOpenCommandPalette,
  onOpenAi,
  onOpenHelp,
  projectId,
}: TenantMobileNavigationSheetProps) {
  const routerState = useRouterState();
  const navigate = useNavigate();
  const pathname = routerState.location.pathname;

  const handleTabChange = (tabId: MobileTabId) => {
    if (tabId === "search") {
      onOpenChange(false);
      onOpenCommandPalette();
      return;
    }
    if (tabId === "ai") {
      onOpenChange(false);
      onOpenAi();
      return;
    }
    if (tabId === "help") {
      onOpenChange(false);
      onOpenHelp();
      return;
    }
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const handleNavigate = (url: string) => {
    onOpenChange(false);
    navigate({ to: url as never });
  };

  return (
    <MobileNavigationSheet
      open={open}
      onOpenChange={onOpenChange}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      tabs={TENANT_TABS}
    >
      {activeTab === "tasks" && (
        <TenantMobileTasksTab
          projectId={projectId}
          onNavigate={handleNavigate}
          onClose={() => onOpenChange(false)}
        />
      )}

      {activeTab === "gis" && (
        <TenantMobileGisTab
          projectId={projectId}
          onNavigate={handleNavigate}
          onClose={() => onOpenChange(false)}
        />
      )}

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
