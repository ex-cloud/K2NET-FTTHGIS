"use client";

import * as React from "react";
import { Badge, Button } from "@k2net/ui";
import {
  Search,
  X,
  PanelLeft,
  RefreshCw,
  BarChart2,
  Download,
  Play,
  SlidersHorizontal,
  Columns3,
  ChevronRight,
  Check,
} from "lucide-react";
import {
  useLogsFilter,
  LOG_TYPES_LABELS,
  type AdvancedFilter,
  type AdvancedFilterField,
  type AdvancedFilterOperator,
  FILTER_FIELD_LABELS,
  FILTER_OPERATOR_LABELS,
} from "./logs-filter-context";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import type { Table } from "@tanstack/react-table";
import type { AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import { cn } from "@k2net/ui";

// ─── Filter Fields available in builder ──────────────────────────────────────

const FILTER_FIELDS: AdvancedFilterField[] = [
  "logType", "status", "method", "pathname", "actor", "message", "tenantSlug", "serviceSource",
];

const FILTER_OPERATORS: AdvancedFilterOperator[] = [
  "eq", "neq", "contains", "not_contains", "starts_with", "ends_with",
];

const FIELD_SUGGESTIONS: Partial<Record<AdvancedFilterField, string[]>> = {
  logType:       ["edge", "auth", "postgres", "audit", "notification", "scheduler", "storage", "export", "payment", "olt", "poller", "map", "whatsapp"],
  method:        ["GET", "POST", "PUT", "PATCH", "DELETE"],
  status:        ["200", "201", "204", "400", "401", "403", "404", "500"],
  serviceSource: ["kong-gateway", "keycloak", "backend", "gateway-audit", "gateway-notification"],
};

// ─── Column Toggle Popover ────────────────────────────────────────────────────

interface ColumnPickerProps {
  table: Table<AuditStreamEntry>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columnVisibility: any; // passed only to trigger re-render when visibility changes
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

function ColumnPicker({ table, columnVisibility, anchorRef, onClose }: ColumnPickerProps) {
  const [mounted, setMounted] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [coords, setCoords] = React.useState({ top: 0, right: 0 });
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right + window.scrollX,
      });
    }
  // columnVisibility intentionally excluded: prop change causes parent re-render
  // which re-renders ColumnPicker; only recompute coords on mount / anchor change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorRef]);

  React.useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        anchorRef.current && !anchorRef.current.contains(target)
      ) { onClose(); }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [onClose, anchorRef]);

  const allColumns = table.getAllLeafColumns().filter(
    (col) => col.id !== "select" && col.id !== "level"
  );
  const filtered = search.trim()
    ? allColumns.filter((col) =>
        ((col.columnDef.meta as { label?: string })?.label ?? col.id)
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : allColumns;

  if (!mounted) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{ position: "absolute", top: `${coords.top}px`, right: `${coords.right}px` }}
      className="z-[9999] w-[220px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden font-mono text-xs text-foreground"
    >
      <div className="px-3 pt-3 pb-2 border-b border-border/50">
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search columns..."
            className="w-full pl-6 pr-2 py-1.5 text-[11px] bg-muted/30 border border-border/60 rounded-md text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60"
          />
        </div>
      </div>
      <div className="px-1.5 py-1.5 max-h-[280px] overflow-y-auto custom-scrollbar-thin">
        {filtered.map((col) => {
          const label = (col.columnDef.meta as { label?: string })?.label ?? col.id;
          // Derive visibility directly from the passed columnVisibility prop to avoid
          // stale closure issues with col.getIsVisible(). undefined key = visible.
          const isVisible = (columnVisibility as Record<string, boolean>)?.[col.id] !== false;
          return (
            <label
              key={col.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => col.toggleVisibility(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-border text-primary accent-primary cursor-pointer"
              />
              <span className="text-[11px] text-foreground/80">{label}</span>
              {isVisible && <Check className="w-3 h-3 text-primary ml-auto shrink-0" />}
            </label>
          );
        })}
      </div>
    </div>,
    document.body
  );
}

// ─── Filter Builder Popover ───────────────────────────────────────────────────

type BuilderStep = "field" | "operator" | "value";

interface FilterBuilderProps {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onAdd: (f: AdvancedFilter) => void;
}

function FilterBuilder({ anchorRef, onClose, onAdd }: FilterBuilderProps) {
  const [mounted, setMounted] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });
  const [step, setStep] = React.useState<BuilderStep>("field");
  const [field, setField] = React.useState<AdvancedFilterField | null>(null);
  const [operator, setOperator] = React.useState<AdvancedFilterOperator | null>(null);
  const [value, setValue] = React.useState("");
  const panelRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setMounted(true);
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
  }, [anchorRef]);

  React.useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        anchorRef.current && !anchorRef.current.contains(target)
      ) { onClose(); }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [onClose, anchorRef]);

  React.useEffect(() => {
    if (step === "value") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [step]);

  const handleSelectField = (f: AdvancedFilterField) => { setField(f); setStep("operator"); };
  const handleSelectOperator = (op: AdvancedFilterOperator) => { setOperator(op); setStep("value"); };

  const handleApply = () => {
    if (field && operator && value.trim()) {
      onAdd({ id: crypto.randomUUID(), field, operator, value: value.trim() });
      onClose();
    }
  };

  const handleSuggestion = (s: string) => {
    if (field && operator) {
      onAdd({ id: crypto.randomUUID(), field, operator, value: s });
      onClose();
    } else {
      setValue(s);
    }
  };

  if (!mounted) return null;
  const suggestions = field ? (FIELD_SUGGESTIONS[field] ?? []) : [];

  return createPortal(
    <div
      ref={panelRef}
      style={{ position: "absolute", top: `${coords.top}px`, left: `${coords.left}px` }}
      className="z-[9999] w-[240px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden font-mono text-xs text-foreground"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border/50 text-[10px] text-muted-foreground/70 flex-wrap">
        <span className={cn("transition-colors", step === "field" ? "text-foreground font-semibold" : "text-muted-foreground/50")}>
          Field
        </span>
        {field && (
          <>
            <ChevronRight className="w-2.5 h-2.5 shrink-0" />
            <span className={cn("transition-colors", step === "operator" ? "text-foreground font-semibold" : "text-muted-foreground/50")}>
              {FILTER_FIELD_LABELS[field]}
            </span>
          </>
        )}
        {operator && (
          <>
            <ChevronRight className="w-2.5 h-2.5 shrink-0" />
            <span className={cn("transition-colors", step === "value" ? "text-foreground font-semibold" : "text-muted-foreground/50")}>
              {FILTER_OPERATOR_LABELS[operator]}
            </span>
          </>
        )}
      </div>

      {/* Step: Field */}
      {step === "field" && (
        <div className="max-h-[280px] overflow-y-auto custom-scrollbar-thin py-1">
          {FILTER_FIELDS.map((f) => (
            <button key={f} onClick={() => handleSelectField(f)}
              className="w-full text-left px-3 py-2 text-[11px] hover:bg-muted/50 text-foreground/80 hover:text-foreground transition-colors flex items-center justify-between">
              <span>{FILTER_FIELD_LABELS[f]}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
            </button>
          ))}
        </div>
      )}

      {/* Step: Operator */}
      {step === "operator" && field && (
        <div className="max-h-[280px] overflow-y-auto custom-scrollbar-thin py-1">
          {FILTER_OPERATORS.map((op) => (
            <button key={op} onClick={() => handleSelectOperator(op)}
              className="w-full text-left px-3 py-2 text-[11px] hover:bg-muted/50 text-foreground/80 hover:text-foreground transition-colors flex items-center justify-between">
              <span>{FILTER_OPERATOR_LABELS[op]}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
            </button>
          ))}
        </div>
      )}

      {/* Step: Value */}
      {step === "value" && field && operator && (
        <div className="p-3 space-y-3">
          <div className="text-[10px] text-muted-foreground">
            <span className="text-foreground font-semibold">{FILTER_FIELD_LABELS[field]}</span>{" "}
            <span className="text-primary/80">{FILTER_OPERATOR_LABELS[operator]}</span>
          </div>
          <input
            ref={inputRef}
            type={field === "status" ? "number" : "text"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApply();
              if (e.key === "Escape") onClose();
            }}
            placeholder={`Enter ${FILTER_FIELD_LABELS[field].toLowerCase()}...`}
            className="w-full bg-muted/30 border border-border/60 rounded-md px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60"
          />
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {suggestions.map((s) => (
                <button key={s} onClick={() => handleSuggestion(s)}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] border transition-colors font-mono",
                    value === s
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <button onClick={onClose}
              className="flex-1 px-2 py-1 rounded border border-border/60 text-[11px] text-muted-foreground hover:bg-muted/60 transition-colors">
              Cancel
            </button>
            <button onClick={handleApply} disabled={!value.trim()}
              className={cn(
                "flex-1 px-2 py-1 rounded text-[11px] font-semibold transition-colors",
                value.trim()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted/40 text-muted-foreground/50 cursor-not-allowed"
              )}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LogsTopHeader({
  filteredLogs,
  clearLogs,
  table,
}: {
  filteredLogs: AuditStreamEntry[];
  clearLogs: () => void;
  table: Table<AuditStreamEntry>;
}) {
  const {
    searchQuery, setSearchQuery,
    selectedTypes, toggleType, setLogType,
    selectedLevels, toggleLevel,
    isLivePaused, setIsLivePaused,
    showHistogram, setShowHistogram,
    setIsSidebarCollapsed,
    advancedFilters, addAdvancedFilter, removeAdvancedFilter,
  } = useLogsFilter();

  const [showFilterBuilder, setShowFilterBuilder] = React.useState(false);
  const filterAnchorRef = React.useRef<HTMLDivElement>(null);
  const [showColumnPicker, setShowColumnPicker] = React.useState(false);
  const columnBtnRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const activeTypePills = React.useMemo(
    () => Object.entries(selectedTypes)
      .filter(([, active]) => active)
      .map(([key]) => ({ id: key, label: `Log Type = ${LOG_TYPES_LABELS[key] ?? key}`, kind: "type" as const })),
    [selectedTypes]
  );

  const activeLevelPills = React.useMemo(
    () => Object.entries(selectedLevels)
      .filter(([, active]) => active)
      .map(([key]) => ({ id: key, label: `Level = ${key}`, kind: "level" as const })),
    [selectedLevels]
  );

  const advancedPills = React.useMemo(() =>
    advancedFilters.map((f) => ({
      id: f.id,
      label: `${FILTER_FIELD_LABELS[f.field]} ${FILTER_OPERATOR_LABELS[f.operator]} ${f.value}`,
      kind: "advanced" as const,
    })),
    [advancedFilters]
  );

  const allPills = [...activeTypePills, ...activeLevelPills, ...advancedPills];
  const hasActivePills = allPills.length > 0;

  const handleRemovePill = (pill: { id: string; kind: "type" | "level" | "advanced" }) => {
    if (pill.kind === "type") toggleType(pill.id);
    else if (pill.kind === "level") toggleLevel(pill.id);
    else removeAdvancedFilter(pill.id);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `k2net-logs-${Date.now()}.json`);
    document.body.appendChild(a); a.click(); a.remove();
    toast.success(`Exported ${filteredLogs.length} log events to JSON.`);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/60 backdrop-blur-md shrink-0 h-12 w-full font-mono text-xs select-none">
      {/* Sidebar toggle */}
      <button onClick={() => setIsSidebarCollapsed((prev) => !prev)} title="Toggle Filter Sidebar"
        className="shrink-0 p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
        <PanelLeft className="w-4 h-4" />
      </button>

      {/* Search + Filter pills */}
      <div
        className="flex-1 flex items-center gap-1.5 bg-background border border-border/80 rounded-lg px-3 py-1 text-xs focus-within:border-primary transition-colors overflow-hidden min-w-0 cursor-text"
        onClick={() => { if (!showFilterBuilder) inputRef.current?.focus(); }}
      >
        <Search className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
        <div className="flex items-center gap-1.5 flex-wrap flex-1 overflow-hidden min-w-0">
          {allPills.map((pill) => (
            <Badge key={`${pill.kind}-${pill.id}`}
              className="text-[10px] font-mono bg-muted text-foreground border border-border/60 gap-1 px-2 py-0.5 shrink-0 whitespace-nowrap">
              <span>{pill.label}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleRemovePill(pill); }}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label={`Remove filter ${pill.label}`}>
                <X className="w-2.5 h-2.5" />
              </button>
            </Badge>
          ))}

          <div ref={filterAnchorRef} className="flex-1 flex items-center gap-1 min-w-[120px]">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowFilterBuilder(true)}
              placeholder={hasActivePills ? "Add more filters..." : "Filter by Log Type, Level, Status..."}
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 text-xs font-mono"
            />
            <button
              onClick={(e) => { e.stopPropagation(); setShowFilterBuilder((prev) => !prev); }}
              title="Add structured filter"
              className={cn(
                "shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] border transition-colors",
                showFilterBuilder
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "border-border/40 text-muted-foreground/60 hover:text-foreground hover:bg-muted/40"
              )}>
              <SlidersHorizontal className="w-3 h-3" />
            </button>
          </div>
        </div>
        {searchQuery && (
          <button onClick={() => setSearchQuery("")}
            className="shrink-0 text-muted-foreground/60 hover:text-foreground transition-colors">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 shrink-0 pl-2">
        <Button variant="ghost" size="sm"
          onClick={() => { clearLogs(); toast.info("Refreshing real-time log feed..."); }}
          title="Refresh Log Feed"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground border border-border/60 rounded-md">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm"
          onClick={() => setShowHistogram((prev) => !prev)}
          title="Toggle Histogram"
          className={`h-7 w-7 p-0 border border-border/60 rounded-md ${showHistogram ? "bg-muted text-foreground" : "text-muted-foreground"}`}>
          <BarChart2 className="w-3.5 h-3.5" />
        </Button>
        <Button ref={columnBtnRef} variant="ghost" size="sm"
          onClick={() => setShowColumnPicker((prev) => !prev)}
          title="Column Visibility"
          className={`h-7 w-7 p-0 border border-border/60 rounded-md ${showColumnPicker ? "bg-muted text-foreground" : "text-muted-foreground"}`}>
          <Columns3 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleExportJson}
          title="Download Filtered JSON"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground border border-border/60 rounded-md">
          <Download className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="sm"
          onClick={() => setIsLivePaused((prev) => !prev)}
          className={`h-7 text-xs font-mono gap-1.5 border-border/80 rounded-md px-2.5 ${
            isLivePaused
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }`}>
          {isLivePaused
            ? <Play className="w-3 h-3 fill-current" />
            : <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          }
          {isLivePaused ? "Paused" : "Live"}
        </Button>
      </div>

      {showFilterBuilder && (
        <FilterBuilder
          anchorRef={filterAnchorRef}
          onClose={() => setShowFilterBuilder(false)}
          onAdd={(f) => {
            if (f.field === "logType") {
              if (f.operator === "eq") {
                setLogType(f.value, true);
                toast.success(`Active filter: Log Type = ${LOG_TYPES_LABELS[f.value] ?? f.value}`);
              } else if (f.operator === "neq") {
                setLogType(f.value, false);
                toast.success(`Deactivated filter: Log Type != ${LOG_TYPES_LABELS[f.value] ?? f.value}`);
              }
            } else {
              addAdvancedFilter(f);
            }
          }}
        />
      )}
      {showColumnPicker && (
        <ColumnPicker
          table={table}
          columnVisibility={table.getState().columnVisibility}
          anchorRef={columnBtnRef}
          onClose={() => setShowColumnPicker(false)}
        />
      )}
    </div>
  );
}
