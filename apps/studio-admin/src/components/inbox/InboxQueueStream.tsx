import * as React from "react";
import { Inbox, Search, RefreshCw } from "lucide-react";
import { Button, Input } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { cn } from "@/lib/utils";
import {
  type InboxQueueItem,
  type QuickPill,
  formatRelativeTime,
  stripMarkdown,
} from "./inbox-types";

interface InboxQueueStreamProps {
  items: InboxQueueItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchRef?: React.RefObject<HTMLInputElement | null>;
  quickPill: QuickPill;
  onQuickPillChange: (pill: QuickPill) => void;
  activeSectionTitle: string;
  isLoading: boolean;
  justUpdated?: boolean;
  isMobileDetailOpen?: boolean;
  onRefresh: () => void;
}

export function InboxQueueStream({
  items,
  selectedItemId,
  onSelectItem,
  searchQuery,
  onSearchChange,
  searchRef,
  quickPill,
  onQuickPillChange,
  activeSectionTitle,
  isLoading,
  justUpdated,
  isMobileDetailOpen,
  onRefresh,
}: InboxQueueStreamProps) {
  const { t } = useTranslation();
  const selectedItemRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedItemId]);

  return (
    <div
      className={cn(
        "w-full lg:w-[380px] xl:w-[400px] shrink-0 border-r border-border/60 flex flex-col h-full bg-background/95 z-10",
        isMobileDetailOpen && "hidden lg:flex"
      )}
    >
      {/* Header Stream */}
      <div className="p-3 border-b border-border/60 space-y-2.5 shrink-0 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-foreground tracking-tight">
              {activeSectionTitle}
            </h2>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              {items.length}
            </span>
            {justUpdated && (
              <span
                className="relative flex h-2 w-2"
                title={t("common.inbox_just_updated")}
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/75 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            title={t("common.inbox_refresh_queue")}
          >
            <RefreshCw className={cn("size-3", isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Search Box with / shortcut hint */}
        <div className="relative">
          <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchRef}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("common.inbox_search_placeholder")}
            className="h-7 pl-8 pr-7 text-xs bg-muted/30 border-border/60 focus-visible:ring-1"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1 py-0.2 rounded bg-muted/60 text-muted-foreground border border-border/50 pointer-events-none select-none">
            /
          </kbd>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => onQuickPillChange("all")}
            className={cn(
              "px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer",
              quickPill === "all"
                ? "bg-foreground text-background font-semibold"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t("common.inbox_pill_all")}
          </button>
          <button
            type="button"
            onClick={() => onQuickPillChange("action_required")}
            className={cn(
              "px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer",
              quickPill === "action_required"
                ? "bg-foreground text-background font-semibold"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t("common.inbox_pill_action_required")}
          </button>
          <button
            type="button"
            onClick={() => onQuickPillChange("high_priority")}
            className={cn(
              "px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer",
              quickPill === "high_priority"
                ? "bg-foreground text-background font-semibold"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t("common.inbox_pill_high_priority")}
          </button>
        </div>
      </div>

      {/* Queue Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40 custom-scrollbar-thin">
        {items.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-48 space-y-2">
            <Inbox className="size-7 text-muted-foreground/40 stroke-1" />
            <p className="text-xs font-semibold text-muted-foreground">
              {t("common.inbox_empty_queue_title")}
            </p>
            <p className="text-[11px] text-muted-foreground/70 max-w-[240px]">
              {t("common.inbox_empty_queue_desc")}
            </p>
          </div>
        ) : (
          items.map((item) => {
            const isSelected = item.id === selectedItemId;
            const isUrgent = item.priority === "URGENT" || item.priority === "HIGH";

            return (
              <div
                key={item.id}
                ref={isSelected ? selectedItemRef : undefined}
                onClick={() => onSelectItem(item.id)}
                className={cn(
                  "p-3 text-left transition-colors relative flex flex-col gap-1 cursor-pointer",
                  isSelected
                    ? "bg-muted/80 border-l-2 border-l-foreground shadow-sm"
                    : "hover:bg-muted/30 border-l-2 border-l-transparent"
                )}
              >
                {/* Row 1: Status Dot + Type Badge + Code + Priority + Time */}
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    {item.status !== "RESOLVED" && item.status !== "CLOSED" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    )}
                    <span className="font-mono text-[10px] font-semibold px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border shrink-0">
                      {item.category === "TRIAL" && t("common.inbox_category_trial")}
                      {item.category === "APPROVAL" && t("common.inbox_category_approval")}
                      {item.category === "LICENSE" && t("common.inbox_category_license")}
                      {item.category === "B2B_TICKET" && t("common.inbox_category_b2b")}
                      {item.category === "ISSUE" && t("common.inbox_category_issue")}
                      {item.category === "PLAN" && t("common.inbox_category_plan")}
                      {item.category === "PROJECT" && t("common.inbox_category_project")}
                      {item.category === "IDEA" && t("common.inbox_category_idea")}
                      {item.category === "DOC" && t("common.inbox_category_doc")}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground font-medium shrink-0">
                      {item.code}
                    </span>
                    {isUrgent && (
                      <span className="text-[10px] font-mono font-bold text-destructive shrink-0">
                        {item.priority}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0 ml-auto">
                    {formatRelativeTime(item.createdAt, t)}
                  </span>
                </div>

                {/* Row 2: Title */}
                <div className="font-medium text-foreground text-xs truncate leading-snug">
                  {item.title}
                </div>

                {/* Row 3: Organization & Stripped Markdown Snippet */}
                <div className="text-[11px] text-muted-foreground truncate leading-relaxed flex items-center gap-1.5">
                  {item.organizationName && (
                    <span className="font-medium text-foreground/75 shrink-0">
                      {item.organizationName} ·
                    </span>
                  )}
                  <span className="truncate">
                    {stripMarkdown(item.description || item.subtitle || "")}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
