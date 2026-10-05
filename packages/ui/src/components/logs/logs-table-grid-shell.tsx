import * as React from "react";
import { Checkbox } from "../checkbox";
import { cn } from "../../utils";
import { Button } from "../button";
import { Copy, X } from "lucide-react";

export interface LogsTableColumn {
  id: string;
  label: string;
  width: string;
  withSpacer?: boolean;
}

export interface LogsTableGridShellProps {
  children: React.ReactNode;
  columns: LogsTableColumn[];
  columnVisibility: Record<string, boolean>;
  isAllSelected?: boolean;
  isSomeSelected?: boolean;
  onToggleSelectAll?: () => void;
  className?: string;
  tableBodyClassName?: string;
  statusBar?: React.ReactNode;
  headerRightActions?: React.ReactNode;
}

export function LogsTableHeader({
  columns,
  columnVisibility,
  isAllSelected,
  isSomeSelected,
  onToggleSelectAll,
  headerRightActions,
}: {
  columns: LogsTableColumn[];
  columnVisibility: Record<string, boolean>;
  isAllSelected?: boolean;
  isSomeSelected?: boolean;
  onToggleSelectAll?: () => void;
  headerRightActions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center px-4 py-2 bg-muted/40 border-groove-b text-[10px] font-medium uppercase tracking-wider text-muted-foreground shrink-0 font-mono select-none">
      <div className="w-[20px] mr-2.5 shrink-0 flex items-center justify-center">
        <Checkbox
          checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
          onCheckedChange={onToggleSelectAll}
          className="size-3.5 rounded-[3px]"
          aria-label="Toggle select all"
        />
      </div>
      {columns.map((col) => {
        if (columnVisibility[col.id] === false) return null;
        return (
          <React.Fragment key={col.id}>
            <div className={`${col.width} shrink-0 truncate font-medium`}>{col.label}</div>
            {col.withSpacer && <div className="w-6 shrink-0" />}
          </React.Fragment>
        );
      })}
      {headerRightActions && <div className="ml-auto shrink-0 flex items-center">{headerRightActions}</div>}
    </div>
  );
}

export interface LogsStatusBarProps {
  isLivePaused?: boolean;
  isHistoricalMode?: boolean;
  filteredCount: number;
  totalCount: number;
  selectedCount?: number;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onClearSelection?: () => void;
  onCopySelected?: () => void;
  rightSlot?: React.ReactNode;
}

export function LogsStatusBar({
  isLivePaused = false,
  isHistoricalMode = false,
  filteredCount,
  totalCount,
  selectedCount = 0,
  hasMore = false,
  isLoadingMore = false,
  onClearSelection,
  onCopySelected,
  rightSlot,
}: LogsStatusBarProps) {
  return (
    <div className="px-6 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground font-mono shrink-0 select-none">
      <div className="flex items-center gap-3">
        <span>
          {isHistoricalMode
            ? `🔬 Forensic Range: ${filteredCount} of ${totalCount} events loaded ${hasMore ? "(Scroll for more)" : "(All loaded)"}`
            : isLivePaused
            ? `⏸ Paused — ${filteredCount} of ${totalCount} events buffered`
            : `● Live Tail — ${filteredCount} of ${totalCount} events matching`}
        </span>
        {isLoadingMore && (
          <span className="text-foreground animate-pulse flex items-center gap-1 font-medium">
            <span>Loading older logs...</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 bg-muted/60 px-2 py-0.5 rounded border border-border">
            <span className="text-foreground font-medium">{selectedCount} selected</span>
            {onCopySelected && (
              <button
                type="button"
                onClick={onCopySelected}
                className="hover:text-foreground text-muted-foreground transition-colors p-0.5 rounded flex items-center gap-1 cursor-pointer font-medium"
                title="Copy selected log IDs"
              >
                <Copy className="w-3 h-3" />
                <span>Copy IDs</span>
              </button>
            )}
            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="hover:text-foreground text-muted-foreground transition-colors p-0.5 rounded cursor-pointer font-medium"
                title="Clear selection"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
        {rightSlot}
      </div>
    </div>
  );
}

export function LogsTableGridShell({
  children,
  columns,
  columnVisibility,
  isAllSelected,
  isSomeSelected,
  onToggleSelectAll,
  className,
  tableBodyClassName,
  statusBar,
  headerRightActions,
}: LogsTableGridShellProps) {
  return (
    <div className={cn("flex flex-col flex-1 min-h-0 bg-card overflow-hidden select-text", className)}>
      <LogsTableHeader
        columns={columns}
        columnVisibility={columnVisibility}
        isAllSelected={isAllSelected}
        isSomeSelected={isSomeSelected}
        onToggleSelectAll={onToggleSelectAll}
        headerRightActions={headerRightActions}
      />
      <div className={cn("flex-1 overflow-y-auto min-h-0 custom-scrollbar divide-y divide-border/30", tableBodyClassName)}>
        {children}
      </div>
      {statusBar}
    </div>
  );
}
