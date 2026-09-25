import * as React from "react";
import {
  Search,
  HelpCircle,
  Sparkles,
  ClipboardList,
  MapPin,
  Menu,
} from "lucide-react";
import { MobileFloatingDock as SharedMobileFloatingDock, type FloatingDockItem } from "@k2net/ui";
import { useTaskStore } from "@/store/task-store";
import { MobileNavigationSheet, type MobileTab } from "./mobile-navigation-sheet";

export function MobileFloatingDock() {
  const unreadB2BCount = useTaskStore((s) => s.unreadB2BCount);
  const [navSheetOpen, setNavSheetOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<MobileTab>("menu");

  const openTab = (tab: MobileTab) => {
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
      label: "Help & Support",
      icon: HelpCircle,
      onClick: () => openTab("help"),
    },
    {
      id: "ai",
      label: "Ask AI Copilot",
      icon: Sparkles,
      onClick: () => openTab("ai"),
    },
    {
      id: "tasks",
      label: "Projects & Issues",
      icon: ClipboardList,
      badgeCount: unreadB2BCount,
      onClick: () => openTab("tasks"),
    },
    {
      id: "gis",
      label: "GIS Spatial Diagnostics",
      icon: MapPin,
      onClick: () => openTab("gis"),
    },
    {
      id: "menu",
      label: "Open Platform Navigation",
      icon: Menu,
      variant: "primary",
      onClick: () => openTab("menu"),
    },
  ];

  return (
    <>
      <SharedMobileFloatingDock items={dockItems} />

      {/* Full Hierarchical Mobile Command Center & Navigation Sheet */}
      <MobileNavigationSheet
        open={navSheetOpen}
        onOpenChange={setNavSheetOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </>
  );
}
