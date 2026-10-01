

import React from "react";
import { ClipboardList, Plus, PanelRight, HelpCircle, Keyboard, LayoutGrid, LayoutList } from "lucide-react";
import { ActionTooltip } from "@k2net/ui";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import { useTranslation } from "@k2net/i18n";

interface TaskHeaderStatsBarProps {
  pageTitle: string;
  scopeDescription: string;
  rightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  onOpenShortcutsHelp: () => void;
  onOpenNewTask: () => void;
  showKpiCards?: boolean;
  onToggleKpiCards?: () => void;
  summary?: {
    totalOpen?: number;
    urgentCount?: number;
    resolvedToday?: number;
  } | null;
  totalElements: number;
}

export function TaskHeaderStatsBar({
  pageTitle,
  scopeDescription,
  rightPanelOpen,
  onToggleRightPanel,
  onOpenShortcutsHelp,
  onOpenNewTask,
  showKpiCards = true,
  onToggleKpiCards,
  summary,
  totalElements,
}: TaskHeaderStatsBarProps) {
  const { t } = useTranslation();
  const { canAccess } = usePermissions();
  const canManageTask = canAccess("system.task.manage");

  return (
    <>
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 md:px-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <ClipboardList className="h-5 w-5 text-primary" />
            {pageTitle}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{scopeDescription}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {onToggleKpiCards && (
            <ActionTooltip label={showKpiCards ? t("tasks.compact_view_tooltip") : t("tasks.standard_view_tooltip")}>
              <button
                onClick={onToggleKpiCards}
                className={cn(
                  "size-8 rounded-md border border-border/80 bg-card flex items-center justify-center transition-colors cursor-pointer",
                  !showKpiCards
                    ? "text-primary border-primary/40 bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
                aria-label={showKpiCards ? "Switch to compact view" : "Switch to standard view"}
              >
                {showKpiCards ? <LayoutList className="size-3.5" /> : <LayoutGrid className="size-3.5" />}
              </button>
            </ActionTooltip>
          )}
          <ActionTooltip label={t("tasks.keyboard_shortcuts")} shortcut="?">
            <button
              onClick={onOpenShortcutsHelp}
              className="size-8 rounded-md border border-border/80 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Keyboard Shortcuts"
            >
              <Keyboard className="size-3.5" />
            </button>
          </ActionTooltip>
          <ActionTooltip label={rightPanelOpen ? t("tasks.close_overview_panel") : t("tasks.open_overview_panel")}>
            <button
              onClick={onToggleRightPanel}
              className={cn(
                "size-8 rounded-md border border-border/80 bg-card flex items-center justify-center transition-colors cursor-pointer",
                rightPanelOpen
                  ? "text-primary border-primary/30 bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={rightPanelOpen ? "Hide overview panel" : "Show overview panel"}
            >
              <PanelRight className="size-3.5" />
            </button>
          </ActionTooltip>
          <ActionTooltip
            label={
              canManageTask
                ? t("tasks.create_issue")
                : t("tasks.read_only_manage_permission")
            }
            shortcut={canManageTask ? "C" : undefined}
          >
            <button
              onClick={onOpenNewTask}
              disabled={!canManageTask}
              className="h-7 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center gap-1.5 px-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs font-medium text-xs"
              aria-label="New Issue"
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">{t("tasks.new_issue")}</span>
              <kbd className="hidden sm:inline text-[10px] opacity-70 font-mono">C</kbd>
            </button>
          </ActionTooltip>
        </div>
      </div>

      {/* ── Inline KPI Stats Bar ────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground/90 font-medium px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{summary?.totalOpen ?? "—"}</span>
          <span>{t("tasks.active_issues")}</span>
          <span title="Total open non-terminal issues" className="cursor-help text-muted-foreground/60 hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "font-bold font-mono",
              (summary?.urgentCount ?? 0) > 0 ? "text-destructive" : "text-foreground"
            )}
          >
            {summary?.urgentCount ?? "—"}
          </span>
          <span>{t("tasks.urgent")}</span>
          <span title="Tasks marked URGENT priority" className="cursor-help text-muted-foreground/60 hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{summary?.resolvedToday ?? "—"}</span>
          <span>{t("tasks.resolved_today")}</span>
          <span title="Tickets resolved or closed today" className="cursor-help text-muted-foreground/60 hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
        </div>
        {totalElements > 0 && (
          <>
            <span className="text-muted-foreground/30 px-1">/</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{totalElements}</span>
              <span>{t("tasks.total")}</span>
            </div>
          </>
        )}
      </div>
    </>
  );
}
