"use client";

import {
  Search,
  Filter,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  Table as TableIcon,
  Plus,
  ChevronDown,
  Layers,
} from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  ActionTooltip,
} from "@k2net/ui";
import { cn } from "@/lib/utils";

interface OrganizationToolbarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  planFilter: string;
  setPlanFilter: (v: string) => void;
  viewMode: "grid" | "list" | "table";
  setViewMode: (v: "grid" | "list" | "table") => void;
  compactView: boolean;
  setCompactView: (v: boolean | ((prev: boolean) => boolean)) => void;
  loading: boolean;
  onRefresh: () => void;
  onNewOrganization: () => void;
}

export function OrganizationToolbar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  planFilter,
  setPlanFilter,
  viewMode,
  setViewMode,
  compactView,
  setCompactView,
  loading,
  onRefresh,
  onNewOrganization,
}: OrganizationToolbarProps) {
  const hasActiveFilter = statusFilter !== "ALL" || planFilter !== "ALL" || searchQuery.trim() !== "";

  return (
    <div className="relative z-30 bg-background/50 backdrop-blur-sm py-2.5 px-6 shrink-0 border-b border-border/60">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* LEFT GROUP: Search + Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by organization name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all h-8"
            />
            <kbd className="absolute right-2.5 top-2 px-1 text-[9px] font-mono text-muted-foreground/60 rounded bg-muted border border-border/60 pointer-events-none">
              /
            </kbd>
          </div>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 text-xs font-normal border-border gap-1.5 bg-card hover:bg-accent",
                  statusFilter !== "ALL" && "border-primary/50 text-primary bg-primary/5"
                )}
              >
                <Filter className="h-3 w-3 text-muted-foreground" />
                <span>
                  Status:{" "}
                  <strong className="font-semibold">
                    {statusFilter === "ALL" ? "All" : statusFilter}
                  </strong>
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 text-xs bg-popover/95 backdrop-blur-xl border-border/80 rounded-xl">
              <DropdownMenuItem onClick={() => setStatusFilter("ALL")} className="cursor-pointer">
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("ACTIVE")} className="cursor-pointer">
                🟢 Active Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("TRIAL")} className="cursor-pointer">
                🔵 Trial Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("PROVISIONING")} className="cursor-pointer">
                🟡 Provisioning
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("SUSPENDED")} className="cursor-pointer text-destructive">
                🔴 Suspended
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Plan Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 text-xs font-normal border-border gap-1.5 bg-card hover:bg-accent",
                  planFilter !== "ALL" && "border-primary/50 text-primary bg-primary/5"
                )}
              >
                <span>
                  Plan:{" "}
                  <strong className="font-semibold">
                    {planFilter === "ALL" ? "All" : planFilter}
                  </strong>
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40 text-xs bg-popover/95 backdrop-blur-xl border-border/80 rounded-xl">
              <DropdownMenuItem onClick={() => setPlanFilter("ALL")} className="cursor-pointer">
                All Plans
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPlanFilter("Starter")} className="cursor-pointer">
                Starter Tier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPlanFilter("Professional")} className="cursor-pointer">
                Professional Tier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPlanFilter("Enterprise")} className="cursor-pointer">
                Enterprise Tier
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
                setPlanFilter("ALL");
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground px-2"
            >
              Reset
            </Button>
          )}
        </div>

        {/* RIGHT GROUP: View Mode Switcher + KPI Toggle + Refresh + New Org */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          {/* Toggle KPI Strip */}
          <ActionTooltip
            label={compactView ? "Show Metric Strip" : "Compact View (Hide KPI Strip)"}
            shortcut="Alt+V"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompactView((prev) => !prev)}
              className={cn(
                "h-8 px-2.5 border-border bg-card hover:bg-accent text-muted-foreground",
                compactView && "text-primary border-primary/40 bg-primary/5"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
            </Button>
          </ActionTooltip>

          {/* View Switcher: Grid, List, Table */}
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
            <ActionTooltip label="Grid View" shortcut="1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-all",
                  viewMode === "grid" && "bg-secondary text-foreground shadow-xs"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </ActionTooltip>

            <ActionTooltip label="List View" shortcut="2">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-all",
                  viewMode === "list" && "bg-secondary text-foreground shadow-xs"
                )}
              >
                <ListIcon className="h-3.5 w-3.5" />
              </button>
            </ActionTooltip>

            <ActionTooltip label="Table View" shortcut="3">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-all",
                  viewMode === "table" && "bg-secondary text-foreground shadow-xs"
                )}
              >
                <TableIcon className="h-3.5 w-3.5" />
              </button>
            </ActionTooltip>
          </div>

          {/* Refresh Button */}
          <ActionTooltip label="Refresh Data" shortcut="R">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="h-8 px-2.5 border-border bg-card hover:bg-accent text-muted-foreground"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-primary")} />
            </Button>
          </ActionTooltip>

          {/* New Organization Button */}
          <ActionTooltip label="Create New Organization" shortcut="N">
            <Button
              size="sm"
              onClick={onNewOrganization}
              className="h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Organization</span>
            </Button>
          </ActionTooltip>
        </div>
      </div>
    </div>
  );
}
