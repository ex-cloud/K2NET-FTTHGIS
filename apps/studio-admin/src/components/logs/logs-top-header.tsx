import * as React from "react";
import { Badge, ActionTooltip, cn } from "@k2net/ui";
import { Search, X, PanelLeft, SlidersHorizontal } from "lucide-react";

import {
  useLogsFilter,
  LOG_TYPES_LABELS,
  type AdvancedFilter,
  FILTER_FIELD_LABELS,
  OPERATOR_SYMBOLS,
} from "./logs-filter-context";
import { parseAnyTimeInput } from "./logs-date-range-types";
import { toast } from "sonner";
import type { Table, VisibilityState } from "@tanstack/react-table";
import type { AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import { useTranslation } from "@k2net/i18n";
import { ColumnPicker } from "./logs-column-picker";
import { SupabaseFilterPalette } from "./logs-supabase-filter-palette";
import { LogsHeaderActions } from "./logs-header-actions";
import { LogsTimeRangeInlinePill } from "./logs-time-range-inline-pill";
import {
  type FilterFieldConfig,
  type SmartParseResult,
  parseSmartFilter,
} from "./logs-filter-palette-config";

// Re-export config types if needed by other components
export type { FilterFieldConfig, SmartParseResult } from "./logs-filter-palette-config";
export { FILTER_FIELD_CONFIGS, parseSmartFilter } from "./logs-filter-palette-config";

export interface LogsTopHeaderProps {
  filteredLogs: AuditStreamEntry[];
  clearLogs: () => void;
  table: Table<AuditStreamEntry>;
  columnVisibility: VisibilityState;
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>;
}

export function LogsTopHeader({
  filteredLogs,
  clearLogs,
  table,
  columnVisibility,
}: LogsTopHeaderProps) {
  const { t } = useTranslation();
  const {
    searchQuery, setSearchQuery,
    timeRange, setTimeRange,
    selectedTypes, toggleType, setLogType,
    selectedLevels, toggleLevel,
    selectedSeverities, toggleSeverity,
    scopeFilter, setScopeFilter,
    projectFilter, setProjectFilter,
    tenantFilter, setTenantFilter,
    includeBenchmark, setIncludeBenchmark,
    isLivePaused, setIsLivePaused,
    showHistogram, setShowHistogram,
    setIsSidebarCollapsed,
    advancedFilters, addAdvancedFilter, removeAdvancedFilter,
  } = useLogsFilter();

  const [showPalette, setShowPalette] = React.useState(false);
  const [inProgressField, setInProgressField] = React.useState<FilterFieldConfig | null>(null);
  const filterAnchorRef = React.useRef<HTMLDivElement>(null);
  const inProgressPillRef = React.useRef<HTMLDivElement>(null);
  const [showTopTimePicker, setShowTopTimePicker] = React.useState(false);
  const timeRangePillRef = React.useRef<HTMLDivElement>(null);
  const [showColumnPicker, setShowColumnPicker] = React.useState(false);
  const columnBtnRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const activePills = React.useMemo(() => {
    const list: Array<{ id: string; label: string; kind: "type" | "level" | "severity" | "scope" | "project" | "tenant" | "benchmark" | "advanced" }> = [];
    Object.entries(selectedTypes).filter(([, a]) => a).forEach(([k]) => list.push({ id: k, label: `Log Type = ${LOG_TYPES_LABELS[k] ?? k}`, kind: "type" }));
    Object.entries(selectedLevels).filter(([, a]) => a).forEach(([k]) => list.push({ id: k, label: `Level = ${k}`, kind: "level" }));
    Object.entries(selectedSeverities).filter(([, a]) => a).forEach(([k]) => list.push({ id: k, label: `Severity = ${k}`, kind: "severity" }));
    if (scopeFilter && scopeFilter !== "ALL") list.push({ id: "scope", label: `Scope = ${scopeFilter}`, kind: "scope" });
    if (projectFilter.trim()) list.push({ id: "project", label: `Project = ${projectFilter}`, kind: "project" });
    if (tenantFilter.trim()) list.push({ id: "tenant", label: `Tenant = ${tenantFilter}`, kind: "tenant" });
    if (includeBenchmark) list.push({ id: "benchmark", label: "⚡ Benchmarks Included", kind: "benchmark" });
    advancedFilters.forEach((f) => list.push({ id: f.id, label: `${FILTER_FIELD_LABELS[f.field]} ${OPERATOR_SYMBOLS[f.operator] || f.operator} ${f.value}`, kind: "advanced" }));
    return list;
  }, [selectedTypes, selectedLevels, selectedSeverities, scopeFilter, projectFilter, tenantFilter, includeBenchmark, advancedFilters]);

  const isTimeRangeActive = timeRange !== "60m" && timeRange !== "1h";
  const hasActivePills = activePills.length > 0 || isTimeRangeActive || inProgressField !== null;

  const handleRemovePill = (pill: { id: string; kind: "type" | "level" | "severity" | "scope" | "project" | "tenant" | "benchmark" | "advanced" }) => {
    if (pill.kind === "type") toggleType(pill.id);
    else if (pill.kind === "level") toggleLevel(pill.id);
    else if (pill.kind === "severity") toggleSeverity(pill.id);
    else if (pill.kind === "scope") setScopeFilter("ALL");
    else if (pill.kind === "project") setProjectFilter("");
    else if (pill.kind === "tenant") setTenantFilter("");
    else if (pill.kind === "benchmark") setIncludeBenchmark(false);
    else removeAdvancedFilter(pill.id);
  };

  const handleApplyFilter = (f: AdvancedFilter) => {
    if (f.field === "logType") {
      setLogType(f.value, f.operator === "eq");
      toast.success(`Filter: Log Type ${f.operator === "eq" ? "=" : "!="} ${LOG_TYPES_LABELS[f.value] ?? f.value}`);
    } else if (f.field === "level" && f.operator === "eq") {
      toggleLevel(f.value.toLowerCase());
      toast.success(`Filter: Level = ${f.value}`);
    } else if (f.field === "severity" && f.operator === "eq") {
      toggleSeverity(f.value.toUpperCase());
      toast.success(`Filter: Severity = ${f.value.toUpperCase()}`);
    } else if (f.field === "scope" && f.operator === "eq") {
      setScopeFilter(f.value.toUpperCase());
      toast.success(`Filter: Scope = ${f.value.toUpperCase()}`);
    } else if (f.field === "tenantSlug" && f.operator === "eq") {
      setTenantFilter(f.value);
      toast.success(`Filter: Tenant = ${f.value}`);
    } else if (f.field === "projectId" && f.operator === "eq") {
      setProjectFilter(f.value);
      toast.success(`Filter: Project = ${f.value}`);
    } else {
      addAdvancedFilter(f);
      toast.success(`Filter: ${FILTER_FIELD_LABELS[f.field]} ${OPERATOR_SYMBOLS[f.operator] || f.operator} ${f.value}`);
    }
    setSearchQuery("");
    setInProgressField(null);
  };

  const handleApplySmartParse = (parsed: SmartParseResult) => {
    if (!parsed.isValid) return;
    if (parsed.isTimeRange && parsed.value) {
      const p = parseAnyTimeInput(parsed.value);
      if (p?.type === "preset") setTimeRange(p.preset);
      else if (p?.type === "custom" && p.range.from) {
        const to = p.range.to || p.range.from;
        setTimeRange(`custom:${p.range.from.toISOString()}_${to.toISOString()}`);
      } else {
        setTimeRange(parsed.value);
      }
      toast.success(`Time range set: ${parsed.value}`);
      setSearchQuery("");
      return;
    }
    if (parsed.field && parsed.operator && parsed.value) {
      handleApplyFilter({ id: crypto.randomUUID(), field: parsed.field, operator: parsed.operator, value: parsed.value });
      return;
    }
    if (parsed.isSearchQuery && parsed.value) {
      addAdvancedFilter({ id: crypto.randomUUID(), field: "message", operator: "ilike", value: parsed.value });
      toast.success(`Filter: Event message ILike "${parsed.value}"`);
      setSearchQuery("");
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/60 backdrop-blur-md shrink-0 h-12 w-full font-mono text-xs select-none">
      <ActionTooltip label={t("observability.toggle_filter_panel")} shortcut="Alt+S">
        <button
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          className="shrink-0 p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      </ActionTooltip>

      <div
        ref={filterAnchorRef}
        className="flex-1 flex items-center gap-1.5 bg-background border border-border/80 rounded-lg px-3 py-1 text-xs transition-colors overflow-hidden min-w-0 cursor-text"
        onClick={() => {
          if (!showTopTimePicker) {
            inputRef.current?.focus();
            setShowPalette(true);
          }
        }}
      >
        <Search className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
        <div className="flex items-center gap-1.5 flex-wrap flex-1 overflow-hidden min-w-0">
          <LogsTimeRangeInlinePill
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            showTopTimePicker={showTopTimePicker}
            setShowTopTimePicker={setShowTopTimePicker}
            filterAnchorRef={filterAnchorRef}
            timeRangePillRef={timeRangePillRef}
          />

          {activePills.map((pill) => (
            <Badge
              key={`${pill.kind}-${pill.id}`}
              className="text-[10px] font-mono bg-muted text-foreground border border-border/60 gap-1 px-2 py-0.5 shrink-0 whitespace-nowrap"
            >
              <span>{pill.label}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePill(pill);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </Badge>
          ))}

          {inProgressField && (
            <div
              ref={inProgressPillRef}
              className="inline-flex items-center text-[10px] font-mono bg-muted text-foreground border border-primary/50 ring-1 ring-primary/30 rounded-md gap-1 px-2 py-0.5 shrink-0 animate-in fade-in"
            >
              <span className="text-foreground font-semibold">{inProgressField.label}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setInProgressField(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors ml-0.5 cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          )}

          <div className="flex-1 flex items-center gap-1 min-w-[140px]">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowPalette(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  e.preventDefault();
                  handleApplySmartParse(parseSmartFilter(searchQuery));
                  setShowPalette(false);
                } else if (e.key === "Escape") {
                  setShowPalette(false);
                  setInProgressField(null);
                }
              }}
              placeholder={hasActivePills ? t("observability.add_more_filters") : t("observability.filter_placeholder")}
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 text-xs font-mono"
            />
            <ActionTooltip label={t("observability.advanced_filter")} shortcut="Alt+F">
              <button
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
          </div>
        </div>

        {searchQuery && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSearchQuery("");
            }}
            className="shrink-0 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <LogsHeaderActions
        filteredLogs={filteredLogs}
        clearLogs={clearLogs}
        showHistogram={showHistogram}
        setShowHistogram={setShowHistogram}
        showColumnPicker={showColumnPicker}
        setShowColumnPicker={setShowColumnPicker}
        columnBtnRef={columnBtnRef}
        isLivePaused={isLivePaused}
        setIsLivePaused={setIsLivePaused}
      />

      {showPalette && (
        <SupabaseFilterPalette
          anchorRef={inProgressField && inProgressPillRef.current ? inProgressPillRef : filterAnchorRef}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onClose={() => {
            setShowPalette(false);
            setInProgressField(null);
          }}
          onApplyFilter={handleApplyFilter}
          onSelectTimeRange={(val) => {
            if (val) {
              const p = parseAnyTimeInput(val);
              if (p?.type === "preset") setTimeRange(p.preset);
              else if (p?.type === "custom" && p.range.from) {
                const to = p.range.to || p.range.from;
                setTimeRange(`custom:${p.range.from.toISOString()}_${to.toISOString()}`);
              } else {
                setTimeRange(val);
              }
            }
            setInProgressField(null);
          }}
          onOpenCustomCalendar={() => {
            setShowTopTimePicker(true);
            setInProgressField(null);
          }}
          onApplySmartParse={handleApplySmartParse}
          initialField={inProgressField}
          onFieldSelectedChange={setInProgressField}
        />
      )}

      {showColumnPicker && (
        <ColumnPicker
          table={table}
          columnVisibility={columnVisibility}
          anchorRef={columnBtnRef}
          onClose={() => setShowColumnPicker(false)}
        />
      )}
    </div>
  );
}
