import * as React from "react";
import { usePathname, useRouter } from "@/lib/navigation-compat";
import {
  Search,
  HelpCircle,
  Sparkles,
  ClipboardList,
  MapPin,
  Menu,
} from "lucide-react";
import {
  MobileNavigationSheet as SharedMobileNavigationSheet,
  type MobileTabHeaderItem,
  type MobileTabId,
} from "@k2net/ui";
import { usePermissions } from "@/hooks/use-permissions";
import { useTaskStore } from "@/store/task-store";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { CommandPaletteContent } from "@/components/command-palette/command-palette-modal";
import type { NavActionItem } from "@/components/command-palette/command-palette-items";
import { MobileHelpTab } from "./mobile-sheet/mobile-help-tab";
import { MobileAiTab } from "./mobile-sheet/mobile-ai-tab";
import { MobileTasksTab } from "./mobile-sheet/mobile-tasks-tab";
import { MobileGisTab } from "./mobile-sheet/mobile-gis-tab";
import { MobileMenu2Tier, getSecondaryKey } from "./mobile-sheet/mobile-menu-2tier";
import { SYSTEM_SIDEBAR_NAVIGATION } from "@/config/system-sidebar-navigation";

export type MobileTab = "search" | "help" | "ai" | "tasks" | "gis" | "menu";

interface MobileNavigationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab?: MobileTab;
  onTabChange?: (tab: MobileTab) => void;
  trigger?: React.ReactNode;
}

export function MobileNavigationSheet({
  open,
  onOpenChange,
  activeTab: controlledTab,
  onTabChange,
  trigger,
}: MobileNavigationSheetProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { canAccess } = usePermissions();
  const unreadB2BCount = useTaskStore((s) => s.unreadB2BCount);
  const { settings = [] } = useSystemSettings();

  const appName = settings.find((s) => s.key === "app_name")?.value || "System Admin";
  const logoUrl = settings.find((s) => s.key === "logo_url")?.value || "";

  // Internal tab state if not controlled
  const [internalTab, setInternalTab] = React.useState<MobileTab>("menu");
  const activeTab = controlledTab ?? internalTab;

  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeSecondaryKey, setActiveSecondaryKey] = React.useState<string | null>(null);

  const handleTabSelect = (tab: MobileTabId) => {
    const castedTab = tab as MobileTab;
    if (onTabChange) onTabChange(castedTab);
    setInternalTab(castedTab);
  };

  // Sync active secondary sidebar with current pathname when opening
  React.useEffect(() => {
    if (open) {
      const currentKey = getSecondaryKey(pathname);
      if (currentKey && SYSTEM_SIDEBAR_NAVIGATION[currentKey]) {
        setActiveSecondaryKey(currentKey);
      } else {
        setActiveSecondaryKey(null);
      }
    }
  }, [open, pathname]);

  const handleNavigate = (url: string) => {
    onOpenChange(false);
    router.push(url);
  };

  const handleSearchSelect = async (item: NavActionItem) => {
    onOpenChange(false);
    if (item.action) {
      await item.action();
    } else if (item.url) {
      router.push(item.url);
    }
  };

  const adminTabs: MobileTabHeaderItem[] = [
    { id: "search", title: "Search & Commands", icon: Search },
    { id: "help", title: "Help & Support", icon: HelpCircle },
    { id: "ai", title: "Ask AI Copilot", icon: Sparkles },
    { id: "tasks", title: "Projects & Issues", icon: ClipboardList, badgeCount: unreadB2BCount },
    { id: "gis", title: "GIS Diagnostics", icon: MapPin },
    { id: "menu", title: "Navigation Menu", icon: Menu, variant: "primary" },
  ];

  return (
    <SharedMobileNavigationSheet
      open={open}
      onOpenChange={onOpenChange}
      activeTab={activeTab}
      onTabChange={handleTabSelect}
      tabs={adminTabs}
      trigger={trigger}
    >
      {/* TAB 1: DESKTOP-ALIGNED SEARCH & COMMAND ENGINE */}
      {activeTab === "search" && (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in-0 duration-200">
          <CommandPaletteContent
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onSelectItem={handleSearchSelect}
            className="h-full"
          />
        </div>
      )}

      {/* TAB 2: HELP & SUPPORT */}
      {activeTab === "help" && (
        <MobileHelpTab
          onNavigate={handleNavigate}
          onOpenAi={() => handleTabSelect("ai")}
        />
      )}

      {/* TAB 3: AUTHENTIC AI ASSISTANT */}
      {activeTab === "ai" && <MobileAiTab onClose={() => onOpenChange(false)} />}

      {/* TAB 4: TASKS & ISSUES INBOX */}
      {activeTab === "tasks" && (
        <MobileTasksTab onNavigate={handleNavigate} />
      )}

      {/* TAB 5: GIS SPATIAL DIAGNOSTICS */}
      {activeTab === "gis" && (
        <MobileGisTab onNavigate={handleNavigate} />
      )}

      {/* TAB 6: NAVIGATION MENU (Level 1 Main <-> Level 2 Secondary) */}
      {activeTab === "menu" && (
        <MobileMenu2Tier
          activeSecondaryKey={activeSecondaryKey}
          onSelectSecondaryKey={setActiveSecondaryKey}
          onNavigate={handleNavigate}
          pathname={pathname}
          appName={appName}
          logoUrl={logoUrl}
          unreadB2BCount={unreadB2BCount}
          canAccess={canAccess}
        />
      )}
    </SharedMobileNavigationSheet>
  );
}
