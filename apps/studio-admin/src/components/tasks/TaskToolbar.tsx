import { Search, RefreshCw } from "lucide-react";
import { ActionTooltip } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { TaskFilterState } from "./TaskFilterMenu";
import {
  LinearDisplayOptionsPopover,
  type DisplayPropertiesState,
  type ViewGrouping,
  type ViewOrdering,
  type ShowClosedFilter,
} from "./LinearDisplayOptionsPopover";
import { TaskToolbarFilterChips } from "./TaskToolbarFilterChips";

interface TaskToolbarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filters: TaskFilterState;
  onToggleFilter: (type: keyof TaskFilterState, value: string) => void;
  onClearFilters: () => void;
  projectsList?: string[];
  selectedProject?: string | null;
  onSelectProject?: (proj: string | null) => void;
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

export function TaskToolbar({
  searchQuery,
  setSearchQuery,
  filters,
  onToggleFilter,
  onClearFilters,
  projectsList,
  selectedProject,
  onSelectProject,
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

          <TaskToolbarFilterChips
            filters={filters}
            onToggleFilter={onToggleFilter}
            onClearFilters={onClearFilters}
            projectsList={projectsList}
            selectedProject={selectedProject}
            onSelectProject={onSelectProject}
          />
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
          <ActionTooltip label="Segarkan Tugas & Tiket" shortcut="R">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border bg-card hover:bg-muted/30 text-foreground rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden disabled:opacity-50"
              aria-label="Refresh tasks"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-primary")} />
              <span className="hidden sm:inline">{loading ? "Loading..." : "Refresh"}</span>
            </button>
          </ActionTooltip>
        </div>
      </div>
    </div>
  );
}
