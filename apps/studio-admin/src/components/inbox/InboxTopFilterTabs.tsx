import * as React from "react";
import {
  Inbox,
  RefreshCw,
  CheckSquare,
  Building2,
  KeyRound,
  User,
  PenTool,
  Archive,
} from "lucide-react";
import { Button, Badge } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { cn } from "@/lib/utils";

export interface InboxTabCounts {
  all: number;
  approvals: number;
  trials: number;
  licensing: number;
  assigned: number;
  created: number;
  resolved: number;
}

export interface InboxTopFilterTabsProps {
  currentFilter: string;
  onFilterChange: (filterId: string) => void;
  tabCounts: InboxTabCounts;
  justUpdated?: boolean;
  isLoading?: boolean;
  onRefresh: () => void;
}

export function InboxTopFilterTabs({
  currentFilter,
  onFilterChange,
  tabCounts,
  justUpdated,
  isLoading,
  onRefresh,
}: InboxTopFilterTabsProps) {
  const { t } = useTranslation();

  const triageTabs = React.useMemo(
    () => [
      {
        id: "all",
        label: t("nav.inbox_filter_all"),
        icon: Inbox,
        count: tabCounts.all,
      },
      {
        id: "approvals",
        label: t("nav.inbox_filter_approvals"),
        icon: CheckSquare,
        count: tabCounts.approvals,
      },
      {
        id: "trials",
        label: t("nav.inbox_filter_trials"),
        icon: Building2,
        count: tabCounts.trials,
      },
      {
        id: "licensing",
        label: t("nav.inbox_filter_licensing"),
        icon: KeyRound,
        count: tabCounts.licensing,
      },
    ],
    [t, tabCounts]
  );

  const personalTabs = React.useMemo(
    () => [
      {
        id: "assigned",
        label: t("nav.inbox_filter_assigned"),
        icon: User,
        count: tabCounts.assigned,
      },
      {
        id: "created",
        label: t("nav.inbox_filter_created"),
        icon: PenTool,
        count: tabCounts.created,
      },
      {
        id: "resolved",
        label: t("nav.inbox_filter_resolved"),
        icon: Archive,
        count: tabCounts.resolved,
      },
    ],
    [t, tabCounts]
  );

  return (
    <div className="h-11 px-4 border-b border-border/80 bg-background/95 backdrop-blur-xs flex items-center justify-between shrink-0 overflow-x-auto custom-scrollbar-thin z-10">
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Zona Kiri: Triage */}
        {triageTabs.map((tab) => {
          const isActive = currentFilter === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilterChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 h-11 px-2.5 text-xs font-medium border-b-2 transition-all duration-150 cursor-pointer shrink-0",
                isActive
                  ? "border-primary text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
              )}
            >
              <TabIcon
                className={cn(
                  "size-3.5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-mono transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary font-bold"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}

        {/* Divider Vertikal */}
        <div className="h-4 w-px bg-border/60 mx-1.5 shrink-0" />

        {/* Zona Kanan: Personal & Arsip */}
        {personalTabs.map((tab) => {
          const isActive = currentFilter === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilterChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 h-11 px-2.5 text-xs font-medium border-b-2 transition-all duration-150 cursor-pointer shrink-0",
                isActive
                  ? "border-primary text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
              )}
            >
              <TabIcon
                className={cn(
                  "size-3.5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-mono transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary font-bold"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Far Right Action Toolbar: Refresh & Status */}
      <div className="flex items-center gap-2 pl-4 shrink-0">
        {justUpdated && (
          <Badge
            variant="secondary"
            className="font-mono text-[10px] hidden sm:flex items-center gap-1.5 animate-pulse py-0.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {t("common.inbox_just_updated")}
          </Badge>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
          title={t("common.inbox_refresh_queue")}
        >
          <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
        </Button>
      </div>
    </div>
  );
}
