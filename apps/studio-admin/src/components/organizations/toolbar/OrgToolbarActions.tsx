import * as React from "react";
import {
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  Table as TableIcon,
  Plus,
  Layers,
  Upload,
} from "lucide-react";
import { Button, ActionTooltip } from "@k2net/ui";
import { cn } from "@/lib/utils";

interface OrgToolbarActionsProps {
  viewMode: "grid" | "list" | "table";
  setViewMode: (v: "grid" | "list" | "table") => void;
  compactView: boolean;
  setCompactView: (v: boolean | ((prev: boolean) => boolean)) => void;
  loading: boolean;
  onRefresh: () => void;
  onNewOrganization: () => void;
  onImportBackup?: () => void;
}

export function OrgToolbarActions({
  viewMode,
  setViewMode,
  compactView,
  setCompactView,
  loading,
  onRefresh,
  onNewOrganization,
  onImportBackup,
}: OrgToolbarActionsProps) {
  return (
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

      {/* Import Backup Button */}
      {onImportBackup && (
        <ActionTooltip label="Impor Cadangan Tenant (.JSON)">
          <Button
            variant="outline"
            size="sm"
            onClick={onImportBackup}
            className="h-8 text-xs font-medium gap-1.5 border-border bg-card hover:bg-accent text-foreground shadow-xs"
          >
            <Upload className="h-3.5 w-3.5 text-primary" />
            <span>Import Backup</span>
          </Button>
        </ActionTooltip>
      )}

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
  );
}
