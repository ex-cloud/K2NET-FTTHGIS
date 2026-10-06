import * as React from "react";
import { Checkbox } from "../checkbox";
import { cn } from "../../utils";
import { Button } from "../button";
import { Copy, X, Terminal, RotateCcw, Clock, Calendar, Loader2 } from "lucide-react";

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

// ─────────────────────────────────────────────────────────────────────────────
// Shared Empty State & Loading State Components
// ─────────────────────────────────────────────────────────────────────────────

export interface LogsEmptyStateCoreProps {
  title?: string;
  description?: string;
  totalBufferCount?: number;
  onResetFilters?: () => void;
  onSetTimeRange?: (range: string) => void;
  resetButtonLabel?: string;
  reset24hButtonLabel?: string;
  expand7dButtonLabel?: string;
  iconSlot?: React.ReactNode;
  className?: string;
}

export function LogsEmptyStateCore({
  title = "No matching events",
  description,
  totalBufferCount,
  onResetFilters,
  onSetTimeRange,
  resetButtonLabel = "Clear Active Filters",
  reset24hButtonLabel = "Reset to 24h",
  expand7dButtonLabel = "Expand to 7d",
  iconSlot,
  className,
}: LogsEmptyStateCoreProps) {
  const defaultDesc =
    totalBufferCount !== undefined && totalBufferCount > 0
      ? `${totalBufferCount} raw event${totalBufferCount !== 1 ? "s" : ""} exist in this buffer — try clearing active filters or widening the time range.`
      : "No events recorded in this time range. Adjust your query or await live streams.";

  return (
    <div className={cn("h-full flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground select-none", className)}>
      <div className="w-12 h-12 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-center shadow-xs">
        {iconSlot || <Terminal className="w-6 h-6 text-muted-foreground/60" />}
      </div>
      <div className="text-center space-y-1">
        <p className="font-semibold text-foreground text-sm font-sans">
          {title}
        </p>
        <p className="text-[11px] text-muted-foreground/70 font-sans max-w-[320px] leading-relaxed">
          {description || defaultDesc}
        </p>
      </div>

      {(onResetFilters || onSetTimeRange) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {onResetFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="h-8 px-3 text-xs font-mono gap-1.5 border-border/80 bg-card hover:bg-muted text-foreground cursor-pointer shadow-xs font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{resetButtonLabel}</span>
            </Button>
          )}
          {onSetTimeRange && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSetTimeRange("24h")}
                className="h-8 px-3 text-xs font-mono gap-1.5 bg-muted/80 hover:bg-muted text-foreground cursor-pointer font-medium"
              >
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{reset24hButtonLabel}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSetTimeRange("7d")}
                className="h-8 px-3 text-xs font-mono gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer font-medium"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{expand7dButtonLabel}</span>
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export interface LogsLoadingStateCoreProps {
  title?: string;
  description?: string;
  className?: string;
}

export function LogsLoadingStateCore({
  title = "Loading audit records...",
  description = "Executing range query against PostgreSQL 17...",
  className,
}: LogsLoadingStateCoreProps) {
  return (
    <div className={cn("h-full flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground select-none", className)}>
      <Loader2 className="w-8 h-8 text-primary animate-spin opacity-80" />
      <div className="text-center space-y-1">
        <p className="font-semibold text-foreground text-xs font-sans">{title}</p>
        <p className="text-[11px] text-muted-foreground/60 font-sans text-center max-w-[280px]">
          {description}
        </p>
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
