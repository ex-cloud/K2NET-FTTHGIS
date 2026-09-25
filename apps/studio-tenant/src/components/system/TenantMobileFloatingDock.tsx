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
  onOpenCommandPalette: () => void;
  onOpenAi: () => void;
  onOpenHelp: () => void;
  onOpenNotif?: () => void;
  projectId?: string;
}

export function TenantMobileFloatingDock({
  onOpenCommandPalette,
  onOpenAi,
  onOpenHelp,
  onOpenNotif,
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
      onClick: onOpenCommandPalette,
    },
    {
      id: "help",
      label: "Help & SOP Guide",
      icon: HelpCircle,
      onClick: onOpenHelp,
    },
    {
      id: "ai",
      label: "Ask AI Copilot (Ctrl+J)",
      icon: Sparkles,
      onClick: onOpenAi,
    },
    {
      id: "tasks",
      label: "Notifikasi & Tiket Gangguan",
      icon: ClipboardList,
      badgeCount: 3,
      onClick: () => {
        if (onOpenNotif) {
          onOpenNotif();
        } else {
          openTab("tasks");
        }
      },
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
        onOpenCommandPalette={onOpenCommandPalette}
        onOpenAi={onOpenAi}
        onOpenHelp={onOpenHelp}
        projectId={projectId}
      />
    </>
  );
}
