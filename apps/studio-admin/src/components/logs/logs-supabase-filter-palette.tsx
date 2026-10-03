import * as React from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  CornerDownLeft,
  CalendarClock,
} from "lucide-react";
import { cn } from "@k2net/ui";
import {
  type AdvancedFilter,
  type AdvancedFilterOperator,
  OPERATOR_SYMBOLS,
} from "./logs-filter-context";
import {
  type FilterFieldConfig,
  type SmartParseResult,
  FILTER_FIELD_CONFIGS,
  parseSmartFilter,
} from "./logs-filter-palette-config";

export interface SupabaseFilterPaletteProps {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onClose: () => void;
  onApplyFilter: (f: AdvancedFilter) => void;
  onSelectTimeRange: (val?: string) => void;
  onOpenCustomCalendar: () => void;
  onApplySmartParse: (parsed: SmartParseResult) => void;
  initialField?: FilterFieldConfig | null;
  onFieldSelectedChange?: (field: FilterFieldConfig | null) => void;
}

export function SupabaseFilterPalette({
  anchorRef,
  searchQuery,
  onSearchQueryChange,
  onClose,
  onApplyFilter,
  onSelectTimeRange,
  onOpenCustomCalendar,
  onApplySmartParse,
  initialField = null,
  onFieldSelectedChange,
}: SupabaseFilterPaletteProps) {
  const [mounted, setMounted] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });
  const [selectedField, setSelectedField] = React.useState<FilterFieldConfig | null>(initialField);
  const [selectedOperator, setSelectedOperator] = React.useState<AdvancedFilterOperator | null>(null);
  const [manualValue, setManualValue] = React.useState("");
  const panelRef = React.useRef<HTMLDivElement>(null);
  const manualInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    onFieldSelectedChange?.(selectedField);
  }, [selectedField, onFieldSelectedChange]);

  React.useEffect(() => {
    setMounted(true);
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
    }
  }, [anchorRef]);

  React.useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target) && anchorRef.current && !anchorRef.current.contains(target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [onClose, anchorRef]);

  React.useEffect(() => {
    if (selectedOperator) {
      setTimeout(() => manualInputRef.current?.focus(), 60);
    }
  }, [selectedOperator]);

  const smartParsed = React.useMemo(() => (!searchQuery.trim() ? null : parseSmartFilter(searchQuery)), [searchQuery]);

  const filteredFields = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return FILTER_FIELD_CONFIGS;
    return FILTER_FIELD_CONFIGS.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.key.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleApplyValue = (valToApply: string) => {
    if (!selectedField) return;
    if (selectedField.key === "timeRange") {
      onSelectTimeRange(valToApply);
      onClose();
      return;
    }
    const op = selectedOperator ?? selectedField.defaultOperator;
    onApplyFilter({
      id: crypto.randomUUID(),
      field: selectedField.key,
      operator: op,
      value: valToApply.trim(),
    });
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{ position: "absolute", top: `${coords.top}px`, left: `${coords.left}px`, width: "320px" }}
      className="z-[9999] rounded-xl border border-border bg-card shadow-2xl overflow-hidden font-mono text-xs text-foreground animate-in fade-in zoom-in-95 duration-100"
    >
      {!selectedField && (
        <div className="flex flex-col max-h-[380px]">
          {smartParsed && smartParsed.isValid && (
            <div className="p-2 border-b border-border/60 bg-primary/5">
              <button
                type="button"
                onClick={() => {
                  onApplySmartParse(smartParsed);
                  onSearchQueryChange("");
                  onClose();
                }}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-foreground transition-colors group cursor-pointer text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
                  <div className="truncate">
                    <div className="text-[10px] text-primary font-semibold uppercase tracking-wider">
                      {smartParsed.isSearchQuery ? "Search Query" : "Smart Auto-Parse"}
                    </div>
                    <div className="text-xs font-medium text-foreground truncate">{smartParsed.displayLabel}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded bg-background border border-border text-[10px] text-muted-foreground group-hover:text-foreground">
                  <span>Enter</span>
                  <CornerDownLeft className="w-2.5 h-2.5" />
                </div>
              </button>
            </div>
          )}

          <div className="px-3 py-2 border-b border-border/40 bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            <span>Filter by field</span>
            <span className="opacity-70 font-normal">{filteredFields.length} fields</span>
          </div>

          <div className="overflow-y-auto custom-scrollbar-thin p-1 space-y-0.5 max-h-[300px]">
            {filteredFields.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  setSelectedField(f);
                  setSelectedOperator(f.key === "timeRange" ? "eq" : null);
                  setManualValue("");
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-muted/60 text-foreground/85 hover:text-foreground transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1 rounded bg-muted/40 border border-border/50 group-hover:border-border transition-colors">
                    {f.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground">{f.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{f.description}</div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-foreground transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedField && !selectedOperator && selectedField.key !== "timeRange" && (
        <div className="flex flex-col max-h-[400px]">
          <div className="px-3 py-2 border-b border-border/60 bg-muted/30 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedField(null)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-background border border-border text-xs font-semibold">
              {selectedField.icon}
              <span>{selectedField.label}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-y-auto custom-scrollbar-thin p-1.5 space-y-2 max-h-[320px]">
            {selectedField.operatorGroups.map((group) => (
              <div key={group.groupName} className="space-y-0.5">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
                  {group.groupName}
                </div>
                {group.operators.map((op) => (
                  <button
                    key={op.key}
                    type="button"
                    onClick={() => setSelectedOperator(op.key)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-muted/60 text-foreground/90 hover:text-foreground transition-colors text-left group cursor-pointer"
                  >
                    <span className="text-xs">{op.label}</span>
                    <span className="text-[11px] font-mono text-muted-foreground/60 group-hover:text-primary transition-colors bg-muted/30 px-1.5 py-0.5 rounded border border-border/40">
                      {op.symbol}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedField && (selectedOperator || selectedField.key === "timeRange") && (
        <div className="flex flex-col max-h-[420px]">
          <div className="px-3 py-2 border-b border-border/60 bg-muted/30 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (selectedField.key === "timeRange") setSelectedField(null);
                else setSelectedOperator(null);
              }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-1 text-xs font-semibold">
              <span>{selectedField.label}</span>
              {selectedOperator && (
                <span className="text-primary font-mono font-bold">
                  {OPERATOR_SYMBOLS[selectedOperator] ?? selectedOperator}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3 space-y-3 overflow-y-auto custom-scrollbar-thin">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
                <span>Value (Type Manual)</span>
                <span className="text-[9px] lowercase opacity-70">Enter to apply</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  ref={manualInputRef}
                  type={selectedField.key === "status" ? "number" : "text"}
                  value={manualValue}
                  onChange={(e) => setManualValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (manualValue.trim()) handleApplyValue(manualValue.trim());
                    } else if (e.key === "Escape") {
                      setSelectedOperator(null);
                    }
                  }}
                  placeholder={selectedField.placeholder}
                  className="flex-1 bg-muted/25 border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-border transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualValue.trim()) handleApplyValue(manualValue.trim());
                  }}
                  disabled={!manualValue.trim()}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all cursor-pointer",
                    manualValue.trim()
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                      : "bg-muted/40 text-muted-foreground/50 border border-border/50 cursor-not-allowed"
                  )}
                >
                  Apply
                </button>
              </div>
            </div>

            {selectedField.quickOptions && selectedField.quickOptions.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-border/40">
                <div className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">Quick Select</div>
                <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto custom-scrollbar-thin p-0.5">
                  {selectedField.quickOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleApplyValue(opt.value)}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono border transition-all cursor-pointer hover:scale-102 active:scale-98",
                        opt.badgeClass || "bg-muted/30 border-border/60 text-foreground/80 hover:text-foreground hover:bg-muted/60"
                      )}
                    >
                      {opt.colorDot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", opt.colorDot)} />}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedField.key === "timeRange" && (
              <div className="pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCustomCalendar();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/80 border border-border text-foreground text-xs font-mono transition-colors cursor-pointer"
                >
                  <CalendarClock className="w-3.5 h-3.5 text-primary" />
                  <span>Open Custom Date-Time Picker...</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
