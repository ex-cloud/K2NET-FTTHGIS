import * as React from "react";
import { PanelLeft, Search, SlidersHorizontal, X } from "lucide-react";
import { ActionTooltip } from "../tooltip";
import { Badge } from "../badge";
import { cn } from "../../utils";
import { LogsTimeRangeInlinePillCore } from "./logs-time-range-inline-pill-core";
import { LogsFilterPaletteCore, type FilterFieldConfig, type AppliedFilter } from "./logs-filter-palette-core";

export interface LogsTopHeaderActivePill {
  id: string;
  label: string;
  onRemove: () => void;
}

export interface LogsTopHeaderShellProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  sidebarTooltipLabel?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  timeRange: string;
  onTimeRangeChange: (val: string) => void;
  activePills?: LogsTopHeaderActivePill[];
  paletteFields?: FilterFieldConfig[];
  onApplyPaletteFilter?: (filter: AppliedFilter) => void;
  rightActionsSlot?: React.ReactNode;
  translateFn?: (key: string) => string;
}

export function LogsTopHeaderShell({
  isSidebarCollapsed,
  onToggleSidebar,
  sidebarTooltipLabel = "Open filter panel",
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Filter by Category, Severity, Action, or Actor...",
  timeRange,
  onTimeRangeChange,
  activePills = [],
  paletteFields,
  onApplyPaletteFilter,
  rightActionsSlot,
  translateFn,
}: LogsTopHeaderShellProps) {
  const [showPalette, setShowPalette] = React.useState(false);
  const [showTopTimePicker, setShowTopTimePicker] = React.useState(false);
  const filterAnchorRef = React.useRef<HTMLDivElement>(null);
  const timeRangePillRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const hasActivePills = activePills.length > 0;

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-groove-b bg-card/60 backdrop-blur-md shrink-0 h-12 w-full font-mono text-xs select-none">
      {/* 1. Sidebar Toggle Button: ONLY rendered when sidebar is collapsed */}
      {isSidebarCollapsed && (
        <ActionTooltip label={sidebarTooltipLabel} shortcut="Alt+S">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="shrink-0 p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>
        </ActionTooltip>
      )}

      {/* 2. Unified Search Input Bar with Embedded Pills */}
      <div
        ref={filterAnchorRef}
        className="flex-1 flex items-center gap-1.5 bg-background border border-border/80 rounded-lg px-2.5 py-1 text-xs transition-colors overflow-hidden min-w-0 cursor-text shadow-2xs focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20"
        onClick={() => {
          if (!showTopTimePicker) {
            inputRef.current?.focus();
            if (paletteFields && paletteFields.length > 0) {
              setShowPalette(true);
            }
          }
        }}
      >
        <Search className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />

        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar py-0.5">
          {/* Time Range Inline Pill */}
          <LogsTimeRangeInlinePillCore
            timeRange={timeRange}
            setTimeRange={onTimeRangeChange}
            showTopTimePicker={showTopTimePicker}
            setShowTopTimePicker={setShowTopTimePicker}
            filterAnchorRef={filterAnchorRef}
            timeRangePillRef={timeRangePillRef}
            translateFn={translateFn}
          />

          {/* Active Filter Badges */}
          {activePills.map((pill) => (
            <Badge
              key={pill.id}
              className="h-5 text-[10px] font-mono bg-muted/90 text-foreground border border-border/70 gap-1 px-1.5 py-0 shrink-0 whitespace-nowrap leading-none flex items-center"
            >
              <span>{pill.label}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  pill.onRemove();
                }}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-0.5 font-medium"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </Badge>
          ))}

          {/* Search Input Field */}
          <div className="flex-1 flex items-center gap-1 min-w-[120px]">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => {
                if (paletteFields && paletteFields.length > 0) {
                  setShowPalette(true);
                }
              }}
              placeholder={hasActivePills ? "Add more filters..." : searchPlaceholder}
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 text-xs font-mono min-w-[80px]"
            />

            {paletteFields && paletteFields.length > 0 && (
              <ActionTooltip label="Filter / Quick Palettes" shortcut="Alt+F">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPalette((prev) => !prev);
                    inputRef.current?.focus();
                  }}
                  className={cn(
                    "shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] border transition-colors cursor-pointer",
                    showPalette
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "border-border/40 text-muted-foreground/60 hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                </button>
              </ActionTooltip>
            )}
          </div>
        </div>

        {searchQuery && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSearchChange("");
            }}
            className="shrink-0 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 3. Action Buttons Right Suite */}
      {rightActionsSlot}

      {/* 4. Interactive Quick Filter Palette */}
      {showPalette && paletteFields && paletteFields.length > 0 && (
        <LogsFilterPaletteCore
          fields={paletteFields}
          anchorRef={filterAnchorRef}
          searchQuery={searchQuery}
          onSearchQueryChange={onSearchChange}
          onClose={() => setShowPalette(false)}
          onApplyFilter={(filter) => {
            onApplyPaletteFilter?.(filter);
            setShowPalette(false);
          }}
          onSelectTimeRange={(val) => {
            if (val) onTimeRangeChange(val);
          }}
        />
      )}
    </div>
  );
}
