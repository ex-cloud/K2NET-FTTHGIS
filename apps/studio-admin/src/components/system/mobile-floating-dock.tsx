import * as React from "react";
import {
  Search,
  HelpCircle,
  Sparkles,
  ClipboardList,
  MapPin,
  Menu,
} from "lucide-react";
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

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex md:hidden pointer-events-auto">
        <div className="flex items-center gap-1 bg-popover/95 backdrop-blur-xl border border-border/80 text-foreground shadow-lg rounded-full px-2.5 py-1.5 text-xs animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* 1. Quick Search / Command Palette */}
          <button
            type="button"
            onClick={() => openTab("search")}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Search or jump to... (Command Palette)"
          >
            <Search className="size-4" />
          </button>

          {/* 2. Help & Support */}
          <button
            type="button"
            onClick={() => openTab("help")}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Help & Support"
          >
            <HelpCircle className="size-4" />
          </button>

          {/* 3. Ask AI Copilot */}
          <button
            type="button"
            onClick={() => openTab("ai")}
            className="p-2 rounded-full hover:bg-muted text-primary hover:text-primary transition-colors cursor-pointer"
            title="Ask AI Copilot"
          >
            <Sparkles className="size-4" />
          </button>

          {/* 4. Tasks & Issues Inbox */}
          <button
            type="button"
            onClick={() => openTab("tasks")}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative cursor-pointer"
            title="Projects & Issues"
          >
            <ClipboardList className="size-4" />
            {unreadB2BCount > 0 && (
              <span className="absolute top-1 right-1 size-2 bg-destructive rounded-full" />
            )}
          </button>

          {/* 5. GIS Spatial Map Telemetry */}
          <button
            type="button"
            onClick={() => openTab("gis")}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="GIS Spatial Diagnostics"
          >
            <MapPin className="size-4" />
          </button>

          <div className="h-4 w-px bg-border/60 mx-0.5" />

          {/* 6. Mobile Navigation Menu Drawer Trigger */}
          <button
            type="button"
            onClick={() => openTab("menu")}
            className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
            title="Open Platform Navigation"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </div>

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
