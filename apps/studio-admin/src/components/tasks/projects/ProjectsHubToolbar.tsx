import React from "react";
import {
  Search,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { toast } from "sonner";
import {
  LinearDisplayOptionsPopover,
  type DisplayPropertiesState,
  type ViewGrouping,
  type ViewOrdering,
  type ShowClosedFilter,
} from "@/components/tasks/LinearDisplayOptionsPopover";
import { cn } from "@/lib/utils";

interface ProjectsHubToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  viewMode: "table" | "timeline";
  setViewMode: (mode: "table" | "timeline") => void;
  grouping: ViewGrouping;
  setGrouping: (grouping: ViewGrouping) => void;
  ordering: ViewOrdering;
  setOrdering: (ordering: ViewOrdering) => void;
  showClosed: ShowClosedFilter;
  setShowClosed: (filter: ShowClosedFilter) => void;
  displayProperties: DisplayPropertiesState;
  onToggleDisplayProperty: (prop: keyof DisplayPropertiesState) => void;
  loading: boolean;
  refresh: () => void;
}

export const ProjectsHubToolbar: React.FC<ProjectsHubToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  viewMode,
  setViewMode,
  grouping,
  setGrouping,
  ordering,
  setOrdering,
  showClosed,
  setShowClosed,
  displayProperties,
  onToggleDisplayProperty,
  loading,
  refresh,
}) => {
  return (
    <div className="relative z-30 bg-background/50 backdrop-blur-sm py-3 shrink-0 border-b border-border/60 overflow-visible">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between px-6">
        {/* LEFT GROUP: Search + Status filter + Priority filter */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-[220px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by project name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all h-8"
            />
          </div>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden",
                  statusFilter !== "ALL"
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-card border-border hover:bg-muted/30 text-foreground"
                )}
              >
                <span>
                  {statusFilter === "ALL"
                    ? "Status"
                    : statusFilter === "IN_PROGRESS"
                    ? "In Progress"
                    : statusFilter === "RESOLVED"
                    ? "Completed"
                    : "Backlog"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover border border-border shadow-xl rounded-xl p-1 min-w-36 z-50">
              <DropdownMenuItem
                onClick={() => setStatusFilter("ALL")}
                className={cn("text-xs py-1.5 px-2.5 rounded-lg cursor-pointer", statusFilter === "ALL" && "bg-primary/10 text-primary font-semibold")}
              >
                <span>All Statuses</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter("IN_PROGRESS")}
                className={cn("text-xs py-1.5 px-2.5 rounded-lg cursor-pointer", statusFilter === "IN_PROGRESS" && "bg-primary/10 text-primary font-semibold")}
              >
                <span>In Progress</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter("TODO")}
                className={cn("text-xs py-1.5 px-2.5 rounded-lg cursor-pointer", statusFilter === "TODO" && "bg-primary/10 text-primary font-semibold")}
              >
                <span>Backlog / Planned</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter("RESOLVED")}
                className={cn("text-xs py-1.5 px-2.5 rounded-lg cursor-pointer", statusFilter === "RESOLVED" && "bg-primary/10 text-primary font-semibold")}
              >
                <span>Completed</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden",
                  priorityFilter !== "ALL"
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-card border-border hover:bg-muted/30 text-foreground"
                )}
              >
                <span>{priorityFilter === "ALL" ? "Priority" : priorityFilter}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover border border-border shadow-xl rounded-xl p-1 min-w-36 z-50">
              <DropdownMenuItem
                onClick={() => setPriorityFilter("ALL")}
                className={cn("text-xs py-1.5 px-2.5 rounded-lg cursor-pointer", priorityFilter === "ALL" && "bg-primary/10 text-primary font-semibold")}
              >
                <span>All Priorities</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setPriorityFilter("URGENT")}
                className={cn("text-xs py-1.5 px-2.5 rounded-lg cursor-pointer", priorityFilter === "URGENT" && "bg-primary/10 text-primary font-semibold")}
              >
                <span className="text-destructive font-semibold">Urgent</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setPriorityFilter("HIGH")}
                className={cn("text-xs py-1.5 px-2.5 rounded-lg cursor-pointer", priorityFilter === "HIGH" && "bg-primary/10 text-primary font-semibold")}
              >
                <span className="text-amber-500 font-semibold">High</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setPriorityFilter("NORMAL")}
                className={cn("text-xs py-1.5 px-2.5 rounded-lg cursor-pointer", priorityFilter === "NORMAL" && "bg-primary/10 text-primary font-semibold")}
              >
                <span>Normal</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setPriorityFilter("LOW")}
                className={cn("text-xs py-1.5 px-2.5 rounded-lg cursor-pointer", priorityFilter === "LOW" && "bg-primary/10 text-primary font-semibold")}
              >
                <span className="text-blue-500">Low</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* RIGHT GROUP: Linear Display Options + Refresh */}
        <div className="flex items-center gap-2">
          <LinearDisplayOptionsPopover
            viewMode={viewMode === "timeline" ? "timeline" : "list"}
            onViewModeChange={(m) => setViewMode(m === "timeline" ? "timeline" : "table")}
            grouping={grouping}
            onGroupingChange={setGrouping}
            ordering={ordering}
            onOrderingChange={setOrdering}
            showClosed={showClosed}
            onShowClosedChange={setShowClosed}
            displayProperties={displayProperties}
            onToggleDisplayProperty={onToggleDisplayProperty}
            availableViews={["list", "timeline"]}
            entityType="projects"
          />

          <button
            onClick={() => {
              refresh();
              toast.info("Refreshing project plans...");
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg bg-card hover:bg-muted/30 text-foreground transition-colors font-semibold h-8 cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", loading && "animate-spin text-primary")} />
            <span className="hidden sm:inline">{loading ? "Loading..." : "Refresh"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
