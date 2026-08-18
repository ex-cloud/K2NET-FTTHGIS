"use client";

import React from "react";
import { Search, ChevronDown, RefreshCw, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "./configs";
import type { TaskFilterState } from "./TaskFilterMenu";
import {
  LinearDisplayOptionsPopover,
  type DisplayPropertiesState,
  type ViewGrouping,
  type ViewOrdering,
  type ShowClosedFilter,
} from "./LinearDisplayOptionsPopover";

interface TaskToolbarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filters: TaskFilterState;
  onToggleFilter: (type: keyof TaskFilterState, value: string) => void;
  onClearFilters: () => void;
  loading: boolean;
  onRefresh: () => void;
  viewMode: "list" | "kanban" | "timeline";
  onViewModeChange: (mode: "list" | "kanban" | "timeline") => void;
  displayProperties: DisplayPropertiesState;
  onToggleDisplayProperty: (prop: keyof DisplayPropertiesState) => void;
  grouping?: ViewGrouping;
  onGroupingChange?: (g: ViewGrouping) => void;
  ordering?: ViewOrdering;
  onOrderingChange?: (o: ViewOrdering) => void;
  showClosed?: ShowClosedFilter;
  onShowClosedChange?: (sc: ShowClosedFilter) => void;
}

const SCOPE_OPTIONS = [
  { id: "PLATFORM_INTERNAL", label: "Internal K2NET" },
  { id: "TENANT_TO_PLATFORM", label: "B2B Inbox" },
];

export function TaskToolbar({
  searchQuery,
  setSearchQuery,
  filters,
  onToggleFilter,
  onClearFilters,
  loading,
  onRefresh,
  viewMode,
  onViewModeChange,
  displayProperties,
  onToggleDisplayProperty,
  grouping,
  onGroupingChange,
  ordering,
  onOrderingChange,
  showClosed,
  onShowClosedChange,
}: TaskToolbarProps) {
  const activeCount =
    filters.status.length +
    filters.priority.length +
    filters.scope.length +
    (filters.assigneeId ? 1 : 0);

  const hasActiveFilter = activeCount > 0;

  return (
    <div className="relative z-30 bg-background/50 backdrop-blur-sm py-3 shrink-0 border-b border-border/60 overflow-visible">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between px-6">
        {/* LEFT GROUP: Search + filter chips */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-[220px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all h-8"
            />
          </div>

          {/* Status filter chip */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden",
                  filters.status.length > 0
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-card border-border hover:bg-muted/30 text-foreground"
                )}
              >
                <span>Status{filters.status.length > 0 ? ` (${filters.status.length})` : ""}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover border border-border shadow-xl rounded-xl p-1 min-w-36 z-50">
              {Object.keys(STATUS_CONFIG).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onToggleFilter("status", key)}
                  className={cn(
                    "text-xs py-1.5 px-2.5 rounded-lg cursor-pointer flex items-center justify-between gap-2",
                    filters.status.includes(key)
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted/50 text-foreground"
                  )}
                >
                  <span>{STATUS_CONFIG[key].label}</span>
                  {filters.status.includes(key) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority filter chip */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden",
                  filters.priority.length > 0
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-card border-border hover:bg-muted/30 text-foreground"
                )}
              >
                <span>Priority{filters.priority.length > 0 ? ` (${filters.priority.length})` : ""}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover border border-border shadow-xl rounded-xl p-1 min-w-32 z-50">
              {Object.keys(PRIORITY_CONFIG).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onToggleFilter("priority", key)}
                  className={cn(
                    "text-xs py-1.5 px-2.5 rounded-lg cursor-pointer flex items-center justify-between gap-2",
                    filters.priority.includes(key)
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted/50 text-foreground"
                  )}
                >
                  <span>{PRIORITY_CONFIG[key].label}</span>
                  {filters.priority.includes(key) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Scope filter chip */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden",
                  filters.scope.length > 0
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-card border-border hover:bg-muted/30 text-foreground"
                )}
              >
                <span>Scope{filters.scope.length > 0 ? ` (${filters.scope.length})` : ""}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover border border-border shadow-xl rounded-xl p-1 min-w-36 z-50">
              {SCOPE_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.id}
                  onClick={() => onToggleFilter("scope", opt.id)}
                  className={cn(
                    "text-xs py-1.5 px-2.5 rounded-lg cursor-pointer flex items-center justify-between gap-2",
                    filters.scope.includes(opt.id)
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted/50 text-foreground"
                  )}
                >
                  <span>{opt.label}</span>
                  {filters.scope.includes(opt.id) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear all filters pill */}
          {hasActiveFilter && (
            <button
              onClick={onClearFilters}
              className="text-[11px] text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2"
            >
              Clear filters ({activeCount})
            </button>
          )}
        </div>

        {/* RIGHT GROUP: Linear Display Options Cluster + Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Linear Display Options Popover */}
          <LinearDisplayOptionsPopover
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            grouping={grouping}
            onGroupingChange={onGroupingChange}
            ordering={ordering}
            onOrderingChange={onOrderingChange}
            showClosed={showClosed}
            onShowClosedChange={onShowClosedChange}
            displayProperties={displayProperties}
            onToggleDisplayProperty={onToggleDisplayProperty}
            availableViews={["list", "kanban", "timeline"]}
            entityType="tasks"
          />

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border bg-card hover:bg-muted/30 text-foreground rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden disabled:opacity-50"
            title="Refresh tasks"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-primary")} />
            <span className="hidden sm:inline">{loading ? "Loading..." : "Refresh"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
