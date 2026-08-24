"use client";

import React from "react";
import { ClipboardList, Plus, PanelRight, HelpCircle, Keyboard, LayoutGrid, LayoutList } from "lucide-react";
import { ActionTooltip } from "@k2net/ui";
import { cn } from "@/lib/utils";

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
        <div className="flex items-center gap-2">
          {onToggleKpiCards && (
            <ActionTooltip label={showKpiCards ? "Compact View (Sembunyikan KPI Strip)" : "Standard View (Tampilkan KPI Strip)"}>
              <button
                onClick={onToggleKpiCards}
                className={cn(
                  "p-2 rounded-lg border border-border bg-card transition-colors cursor-pointer",
                  !showKpiCards
                    ? "text-primary border-primary/40 bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
                aria-label={showKpiCards ? "Switch to compact view" : "Switch to standard view"}
              >
                {showKpiCards ? <LayoutList className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
              </button>
            </ActionTooltip>
          )}
          <ActionTooltip label="Keyboard Shortcuts" shortcut="?">
            <button
              onClick={onOpenShortcutsHelp}
              className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
              aria-label="Keyboard Shortcuts"
            >
              <Keyboard className="h-4 w-4" />
            </button>
          </ActionTooltip>
          <ActionTooltip label={rightPanelOpen ? "Tutup Panel Overview" : "Buka Panel Overview"}>
            <button
              onClick={onToggleRightPanel}
              className={cn(
                "p-2 rounded-lg border border-border bg-card transition-colors cursor-pointer",
                rightPanelOpen
                  ? "text-primary border-primary/30 bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={rightPanelOpen ? "Hide overview panel" : "Show overview panel"}
            >
              <PanelRight className="h-4 w-4" />
            </button>
          </ActionTooltip>
          <ActionTooltip label="Buat Issue Baru" shortcut="C">
            <button
              onClick={onOpenNewTask}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center gap-1.5 px-3 cursor-pointer"
              aria-label="New Issue"
            >
              <Plus className="h-4 w-4" />
              <span className="text-xs font-semibold hidden sm:inline">New Issue</span>
              <kbd className="hidden sm:inline text-[10px] opacity-70 font-mono">C</kbd>
            </button>
          </ActionTooltip>
        </div>
      </div>

      {/* ── Inline KPI Stats Bar ────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground/90 font-medium px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{summary?.totalOpen ?? "—"}</span>
          <span>Active Issues</span>
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
          <span>Urgent</span>
          <span title="Tasks marked URGENT priority" className="cursor-help text-muted-foreground/60 hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{summary?.resolvedToday ?? "—"}</span>
          <span>Resolved Today</span>
          <span title="Tickets resolved or closed today" className="cursor-help text-muted-foreground/60 hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
        </div>
        {totalElements > 0 && (
          <>
            <span className="text-muted-foreground/30 px-1">/</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{totalElements}</span>
              <span>Total</span>
            </div>
          </>
        )}
      </div>
    </>
  );
}
