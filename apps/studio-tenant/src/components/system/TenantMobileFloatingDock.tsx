import * as React from "react";
import {
  Search,
  HelpCircle,
  Sparkles,
  ClipboardList,
  MapPin,
  Menu,
} from "lucide-react";
import { MobileFloatingDock, type FloatingDockItem, type MobileTabId } from "@k2net/ui";
import { TenantMobileNavigationSheet } from "./TenantMobileNavigationSheet";

interface TenantMobileFloatingDockProps {
  projectId?: string;
  onOpenCommandPalette?: () => void;
  onOpenAi?: () => void;
  onOpenHelp?: () => void;
  onOpenNotif?: () => void;
}

export function TenantMobileFloatingDock({
  projectId,
}: TenantMobileFloatingDockProps) {
  const [navSheetOpen, setNavSheetOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<MobileTabId>("menu");

  const openTab = (tab: MobileTabId) => {
    setActiveTab(tab);
    setNavSheetOpen(true);
  };

  const dockItems: FloatingDockItem[] = [
    {
      id: "search",
      label: "Search & Commands (⌘K)",
      icon: Search,
      onClick: () => openTab("search"),
    },
    {
      id: "help",
      label: "Help & SOP Guide",
      icon: HelpCircle,
      onClick: () => openTab("help"),
    },
    {
      id: "ai",
      label: "Ask AI Copilot (Ctrl+J)",
      icon: Sparkles,
      onClick: () => openTab("ai"),
    },
    {
      id: "tasks",
      label: "Notifikasi & Tiket Gangguan",
      icon: ClipboardList,
      badgeCount: 3,
      onClick: () => openTab("tasks"),
    },
    {
      id: "gis",
      label: "Peta Spasial GIS",
      icon: MapPin,
      onClick: () => openTab("gis"),
    },
    {
      id: "menu",
      label: "Menu Navigasi Portal",
      icon: Menu,
      variant: "primary",
      onClick: () => openTab("menu"),
    },
  ];

  return (
    <>
      <MobileFloatingDock items={dockItems} />

      <TenantMobileNavigationSheet
        open={navSheetOpen}
        onOpenChange={setNavSheetOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        projectId={projectId}
      />
    </>
  );
}
