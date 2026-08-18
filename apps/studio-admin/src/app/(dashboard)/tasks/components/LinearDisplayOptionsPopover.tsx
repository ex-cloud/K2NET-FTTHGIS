"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@k2net/ui";
import {
  SlidersHorizontal,
  List,
  Columns3,
  CalendarRange,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DisplayPropertiesState {
  priority: boolean;
  status: boolean;
  assignee: boolean;
  dueDate: boolean;
  scope: boolean;
  type: boolean;
  obsidianRef: boolean;
  created: boolean;
  health?: boolean;
  issues?: boolean;
  lead?: boolean;
  targetDate?: boolean;
}

export type ViewGrouping = "none" | "status" | "priority" | "assignee" | "scope" | "health";
export type ViewOrdering = "manual" | "created" | "dueDate" | "priority" | "title";
export type ShowClosedFilter = "all" | "open" | "closed";

interface LinearDisplayOptionsPopoverProps {
  viewMode: "list" | "kanban" | "timeline";
  onViewModeChange: (mode: "list" | "kanban" | "timeline") => void;
  grouping?: ViewGrouping;
  onGroupingChange?: (g: ViewGrouping) => void;
  ordering?: ViewOrdering;
  onOrderingChange?: (o: ViewOrdering) => void;
  showClosed?: ShowClosedFilter;
  onShowClosedChange?: (sc: ShowClosedFilter) => void;
  displayProperties: DisplayPropertiesState;
  onToggleDisplayProperty: (prop: keyof DisplayPropertiesState) => void;
  availableViews?: Array<"list" | "kanban" | "timeline">;
  entityType?: "tasks" | "projects";
}

const ORDERING_OPTIONS: Array<{ key: ViewOrdering; label: string }> = [
  { key: "manual", label: "Manual" },
  { key: "created", label: "Newest first" },
  { key: "dueDate", label: "Target date" },
  { key: "priority", label: "Priority" },
  { key: "title", label: "Title (A-Z)" },
];

const GROUPING_OPTIONS: Array<{ key: ViewGrouping; label: string }> = [
  { key: "none", label: "No grouping" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "assignee", label: "Assignee / Lead" },
  { key: "scope", label: "Scope" },
  { key: "health", label: "Health" },
];

const SHOW_CLOSED_OPTIONS: Array<{ key: ShowClosedFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "open", label: "Active only" },
  { key: "closed", label: "Closed only" },
];

export function LinearDisplayOptionsPopover({
  viewMode,
  onViewModeChange,
  grouping = "none",
  onGroupingChange,
  ordering = "manual",
  onOrderingChange,
  showClosed = "all",
  onShowClosedChange,
  displayProperties,
  onToggleDisplayProperty,
  availableViews = ["list", "kanban", "timeline"],
  entityType = "tasks",
}: LinearDisplayOptionsPopoverProps) {
  const [open, setOpen] = useState(false);

  // Submenu states
  const [groupingOpen, setGroupingOpen] = useState(false);
  const [orderingOpen, setOrderingOpen] = useState(false);
  const [showClosedOpen, setShowClosedOpen] = useState(false);

  // Property list tailored for tasks vs projects
  const propertyChips: Array<{ key: keyof DisplayPropertiesState; label: string }> =
    entityType === "projects"
      ? [
          { key: "health", label: "Health" },
          { key: "priority", label: "Priority" },
          { key: "lead", label: "Lead" },
          { key: "targetDate", label: "Target date" },
          { key: "issues", label: "Issues count" },
          { key: "status", label: "Status / Progress" },
          { key: "created", label: "Created date" },
          { key: "obsidianRef", label: "Obsidian Ref" },
        ]
      : [
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" },
          { key: "assignee", label: "Assignee" },
          { key: "dueDate", label: "Due date" },
          { key: "scope", label: "Scope" },
          { key: "type", label: "Type" },
          { key: "obsidianRef", label: "Obsidian Ref" },
          { key: "created", label: "Created date" },
        ];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-xs h-8 outline-hidden",
            open
              ? "bg-primary/10 border-primary/40 text-primary"
              : "bg-card border-border hover:bg-muted/40 text-foreground"
          )}
          title="Display / View options"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Display</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-80 p-3.5 bg-popover/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-50 text-xs space-y-3.5"
      >
        {/* ── View Mode Switcher Tabs (Linear Style) ─────────────────────── */}
        <div className="flex items-center bg-muted/40 rounded-xl p-1 border border-border/40">
          {availableViews.includes("list") && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewModeChange("list");
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
          )}

          {availableViews.includes("kanban") && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewModeChange("kanban");
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                viewMode === "kanban"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Columns3 className="h-3.5 w-3.5" />
              <span>Board</span>
            </button>
          )}

          {availableViews.includes("timeline") && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewModeChange("timeline");
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                viewMode === "timeline"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              <span>Timeline</span>
            </button>
          )}
        </div>

        {/* ── Grouping & Ordering Settings ─────────────────────────────────── */}
        <div className="space-y-2 pt-1 border-t border-border/40">
          {/* Grouping Selector */}
          {onGroupingChange && (
            <div className="flex flex-col gap-1">
              <div
                onClick={() => setGroupingOpen((v) => !v)}
                className="flex items-center justify-between py-1 px-1 rounded-md hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <span className="text-muted-foreground font-medium">Grouping</span>
                <span className="inline-flex items-center gap-1 text-foreground font-semibold">
                  {GROUPING_OPTIONS.find((o) => o.key === grouping)?.label ?? "No grouping"}
                  <ChevronDown className={cn("h-3 w-3 transition-transform opacity-60", groupingOpen && "rotate-180")} />
                </span>
              </div>
              {groupingOpen && (
                <div className="grid grid-cols-2 gap-1 p-1 bg-muted/20 rounded-lg border border-border/40 animate-in fade-in-50 duration-100">
                  {GROUPING_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        onGroupingChange(opt.key);
                        setGroupingOpen(false);
                      }}
                      className={cn(
                        "text-[11px] py-1 px-2 rounded text-left transition-colors cursor-pointer flex items-center justify-between",
                        grouping === opt.key ? "bg-primary/15 text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>{opt.label}</span>
                      {grouping === opt.key && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ordering Selector */}
          {onOrderingChange && (
            <div className="flex flex-col gap-1">
              <div
                onClick={() => setOrderingOpen((v) => !v)}
                className="flex items-center justify-between py-1 px-1 rounded-md hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <span className="text-muted-foreground font-medium">Ordering</span>
                <span className="inline-flex items-center gap-1 text-foreground font-semibold">
                  {ORDERING_OPTIONS.find((o) => o.key === ordering)?.label ?? "Manual"}
                  <ChevronDown className={cn("h-3 w-3 transition-transform opacity-60", orderingOpen && "rotate-180")} />
                </span>
              </div>
              {orderingOpen && (
                <div className="grid grid-cols-2 gap-1 p-1 bg-muted/20 rounded-lg border border-border/40 animate-in fade-in-50 duration-100">
                  {ORDERING_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        onOrderingChange(opt.key);
                        setOrderingOpen(false);
                      }}
                      className={cn(
                        "text-[11px] py-1 px-2 rounded text-left transition-colors cursor-pointer flex items-center justify-between",
                        ordering === opt.key ? "bg-primary/15 text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>{opt.label}</span>
                      {ordering === opt.key && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Show Closed Selector */}
          {onShowClosedChange && (
            <div className="flex flex-col gap-1">
              <div
                onClick={() => setShowClosedOpen((v) => !v)}
                className="flex items-center justify-between py-1 px-1 rounded-md hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <span className="text-muted-foreground font-medium">
                  {entityType === "projects" ? "Show closed projects" : "Show closed issues"}
                </span>
                <span className="inline-flex items-center gap-1 text-foreground font-semibold">
                  {SHOW_CLOSED_OPTIONS.find((o) => o.key === showClosed)?.label ?? "All"}
                  <ChevronDown className={cn("h-3 w-3 transition-transform opacity-60", showClosedOpen && "rotate-180")} />
                </span>
              </div>
              {showClosedOpen && (
                <div className="grid grid-cols-3 gap-1 p-1 bg-muted/20 rounded-lg border border-border/40 animate-in fade-in-50 duration-100">
                  {SHOW_CLOSED_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        onShowClosedChange(opt.key);
                        setShowClosedOpen(false);
                      }}
                      className={cn(
                        "text-[11px] py-1 px-2 rounded text-center transition-colors cursor-pointer font-medium",
                        showClosed === opt.key ? "bg-primary/15 text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Display Properties (Linear Chips Toggle) ──────────────────────── */}
        <div className="space-y-2 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Display properties
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {propertyChips.map(({ key, label }) => {
              const active = Boolean(displayProperties[key] ?? true);

              return (
                <button
                  key={String(key)}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleDisplayProperty(key);
                  }}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer shadow-xs active:scale-95",
                    active
                      ? "bg-primary/15 border-primary/50 text-foreground font-bold"
                      : "bg-muted/30 border-border/60 text-muted-foreground/70 hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
