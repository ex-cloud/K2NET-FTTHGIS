import * as React from "react";
import { usePathname, useRouter } from "@/lib/navigation-compat";
import {
  Search,
  HelpCircle,
  Sparkles,
  ClipboardList,
  MapPin,
  Menu,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
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

  const handleTabSelect = (tab: MobileTab) => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-sidebar border-l border-border p-0 dark text-foreground flex flex-col h-full overflow-hidden"
      >
        {/* TOP DOCK PILL HEADER */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/70 bg-background/95 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-1 bg-muted/60 border border-border/80 rounded-full p-1 shadow-xs">
            <button
              type="button"
              onClick={() => handleTabSelect("search")}
              className={cn(
                "size-7 rounded-full flex items-center justify-center transition-all cursor-pointer",
                activeTab === "search"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Search & Commands"
            >
              <Search className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleTabSelect("help")}
              className={cn(
                "size-7 rounded-full flex items-center justify-center transition-all cursor-pointer",
                activeTab === "help"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Help & Support"
            >
              <HelpCircle className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleTabSelect("ai")}
              className={cn(
                "size-7 rounded-full flex items-center justify-center transition-all cursor-pointer",
                activeTab === "ai"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="K2NET AI Copilot"
            >
              <Sparkles className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleTabSelect("tasks")}
              className={cn(
                "size-7 rounded-full flex items-center justify-center transition-all relative cursor-pointer",
                activeTab === "tasks"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Projects & Issues"
            >
              <ClipboardList className="size-3.5" />
              {unreadB2BCount > 0 && (
                <span className="absolute top-0.5 right-0.5 size-1.5 bg-destructive rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabSelect("gis")}
              className={cn(
                "size-7 rounded-full flex items-center justify-center transition-all cursor-pointer",
                activeTab === "gis"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="GIS Diagnostics"
            >
              <MapPin className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleTabSelect("menu")}
              className={cn(
                "size-7 rounded-full flex items-center justify-center transition-all cursor-pointer",
                activeTab === "menu"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Navigation Menu"
            >
              <Menu className="size-3.5" />
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="size-7 rounded-full text-muted-foreground hover:text-foreground cursor-pointer ml-1"
          >
            <X className="size-4" />
          </Button>
        </div>

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

        {/* TAB 3: AUTHENTIC K2NET AI ASSISTANT */}
        {activeTab === "ai" && <MobileAiTab />}

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
      </SheetContent>
    </Sheet>
  );
}
