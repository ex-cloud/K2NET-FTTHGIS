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

interface PaletteFieldListViewProps {
  filteredFields: FilterFieldConfig[];
  highlightedFieldIndex: number;
  fieldListRef: React.RefObject<HTMLDivElement | null>;
  smartParsed: SmartParseResult | null;
  onSelectField: (f: FilterFieldConfig) => void;
  onSetHighlightedIndex: (idx: number) => void;
  onApplySmartParse: (parsed: SmartParseResult) => void;
  onSearchQueryChange: (q: string) => void;
  onClose: () => void;
}

function PaletteFieldListView({
  filteredFields,
  highlightedFieldIndex,
  fieldListRef,
  smartParsed,
  onSelectField,
  onSetHighlightedIndex,
  onApplySmartParse,
  onSearchQueryChange,
  onClose,
}: PaletteFieldListViewProps) {
  return (
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

      <div ref={fieldListRef} className="overflow-y-auto custom-scrollbar-thin p-1 space-y-0.5 max-h-[300px]">
        {filteredFields.map((f, idx) => {
          const isHighlighted = idx === highlightedFieldIndex;
          return (
            <button
              key={f.key}
              data-field-index={idx}
              type="button"
              onClick={() => onSelectField(f)}
              onMouseEnter={() => onSetHighlightedIndex(idx)}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left group cursor-pointer",
                isHighlighted
                  ? "bg-muted text-foreground ring-1 ring-border/80"
                  : "hover:bg-muted/60 text-foreground/85 hover:text-foreground"
              )}
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
          );
        })}
      </div>
    </div>
  );
}

interface PaletteOperatorListViewProps {
  selectedField: FilterFieldConfig;
  highlightedOpIndex: number;
  opListRef: React.RefObject<HTMLDivElement | null>;
  onSelectOperator: (opKey: AdvancedFilterOperator) => void;
  onSetHighlightedIndex: (idx: number) => void;
  onBack: () => void;
  onClose: () => void;
}

function PaletteOperatorListView({
  selectedField,
  highlightedOpIndex,
  opListRef,
  onSelectOperator,
  onSetHighlightedIndex,
  onBack,
  onClose,
}: PaletteOperatorListViewProps) {
  return (
    <div className="flex flex-col max-h-[400px]">
      <div className="px-3 py-2 border-b border-border/60 bg-muted/30 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
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

      <div ref={opListRef} className="overflow-y-auto custom-scrollbar-thin p-1.5 space-y-2 max-h-[320px]">
        {(() => {
          let currentOpIndex = 0;
          return selectedField.operatorGroups.map((group) => (
            <div key={group.groupName} className="space-y-0.5">
              <div className="px-2.5 py-1 text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
                {group.groupName}
              </div>
              {group.operators.map((op) => {
                const opIndex = currentOpIndex++;
                const isHighlighted = opIndex === highlightedOpIndex;
                return (
                  <button
                    key={op.key}
                    data-op-index={opIndex}
                    type="button"
                    onClick={() => onSelectOperator(op.key)}
                    onMouseEnter={() => onSetHighlightedIndex(opIndex)}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors text-left group cursor-pointer",
                      isHighlighted
                        ? "bg-muted text-foreground ring-1 ring-border/80"
                        : "hover:bg-muted/60 text-foreground/90 hover:text-foreground"
                    )}
                  >
                    <span className="text-xs">{op.label}</span>
                    <span className="text-[11px] font-mono text-muted-foreground/60 group-hover:text-primary transition-colors bg-muted/30 px-1.5 py-0.5 rounded border border-border/40">
                      {op.symbol}
                    </span>
                  </button>
                );
              })}
            </div>
          ));
        })()}
      </div>
    </div>
  );
}

interface PaletteValueInputViewProps {
  selectedField: FilterFieldConfig;
  selectedOperator: AdvancedFilterOperator | null;
  manualValue: string;
  manualInputRef: React.RefObject<HTMLInputElement | null>;
  onChangeManualValue: (val: string) => void;
  onApplyValue: (val: string) => void;
  onBack: () => void;
  onClose: () => void;
  onOpenCustomCalendar: () => void;
}

function PaletteValueInputView({
  selectedField,
  selectedOperator,
  manualValue,
  manualInputRef,
  onChangeManualValue,
  onApplyValue,
  onBack,
  onClose,
  onOpenCustomCalendar,
}: PaletteValueInputViewProps) {
  return (
    <div className="flex flex-col max-h-[420px]">
      <div className="px-3 py-2 border-b border-border/60 bg-muted/30 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
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
              onChange={(e) => onChangeManualValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (manualValue.trim()) onApplyValue(manualValue.trim());
                }
              }}
              placeholder={selectedField.placeholder}
              className="flex-1 bg-muted/25 border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-border transition-colors"
            />
            <button
              type="button"
              onClick={() => {
                if (manualValue.trim()) onApplyValue(manualValue.trim());
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
                  onClick={() => onApplyValue(opt.value)}
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
  );
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
  const [highlightedFieldIndex, setHighlightedFieldIndex] = React.useState(0);
  const [highlightedOpIndex, setHighlightedOpIndex] = React.useState(0);

  const panelRef = React.useRef<HTMLDivElement>(null);
  const manualInputRef = React.useRef<HTMLInputElement>(null);
  const fieldListRef = React.useRef<HTMLDivElement>(null);
  const opListRef = React.useRef<HTMLDivElement>(null);

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

  React.useEffect(() => {
    setHighlightedFieldIndex(0);
  }, [filteredFields]);

  const flatOperators = React.useMemo(() => {
    if (!selectedField) return [];
    return selectedField.operatorGroups.flatMap((g) => g.operators);
  }, [selectedField]);

  const handleSelectField = React.useCallback((field: FilterFieldConfig) => {
    setSelectedField(field);
    setSelectedOperator(field.key === "timeRange" ? "eq" : null);
    setManualValue("");
    setHighlightedOpIndex(0);
  }, []);

  const handleApplyValue = React.useCallback((valToApply: string) => {
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
  }, [selectedField, selectedOperator, onSelectTimeRange, onApplyFilter, onClose]);

  // Global keyboard navigation within the palette
  React.useEffect(() => {
    const handlePaletteKeyNav = (e: KeyboardEvent) => {
      if (!selectedField) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlightedFieldIndex((prev) => (filteredFields.length === 0 ? 0 : (prev + 1) % filteredFields.length));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlightedFieldIndex((prev) => (filteredFields.length === 0 ? 0 : (prev - 1 + filteredFields.length) % filteredFields.length));
        } else if (e.key === "Enter") {
          if (filteredFields.length > 0 && highlightedFieldIndex >= 0 && highlightedFieldIndex < filteredFields.length) {
            e.preventDefault();
            handleSelectField(filteredFields[highlightedFieldIndex]);
          }
        } else if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
        return;
      }

      if (selectedField && !selectedOperator && selectedField.key !== "timeRange") {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlightedOpIndex((prev) => (flatOperators.length === 0 ? 0 : (prev + 1) % flatOperators.length));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlightedOpIndex((prev) => (flatOperators.length === 0 ? 0 : (prev - 1 + flatOperators.length) % flatOperators.length));
        } else if (e.key === "Enter") {
          if (flatOperators.length > 0 && highlightedOpIndex >= 0 && highlightedOpIndex < flatOperators.length) {
            e.preventDefault();
            setSelectedOperator(flatOperators[highlightedOpIndex].key);
          }
        } else if (e.key === "Escape" || e.key === "Backspace") {
          e.preventDefault();
          setSelectedField(null);
        }
        return;
      }

      if (selectedField && (selectedOperator || selectedField.key === "timeRange")) {
        if (e.key === "Escape") {
          e.preventDefault();
          if (selectedField.key === "timeRange") {
            setSelectedField(null);
          } else {
            setSelectedOperator(null);
          }
        }
      }
    };

    window.addEventListener("keydown", handlePaletteKeyNav);
    return () => window.removeEventListener("keydown", handlePaletteKeyNav);
  }, [
    selectedField,
    selectedOperator,
    filteredFields,
    flatOperators,
    highlightedFieldIndex,
    highlightedOpIndex,
    handleSelectField,
    onClose,
  ]);

  // Auto-scroll highlighted field into view
  React.useEffect(() => {
    if (!selectedField && fieldListRef.current) {
      const activeEl = fieldListRef.current.querySelector(`[data-field-index="${highlightedFieldIndex}"]`);
      activeEl?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedFieldIndex, selectedField]);

  // Auto-scroll highlighted operator into view
  React.useEffect(() => {
    if (selectedField && !selectedOperator && opListRef.current) {
      const activeEl = opListRef.current.querySelector(`[data-op-index="${highlightedOpIndex}"]`);
      activeEl?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedOpIndex, selectedField, selectedOperator]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{ position: "absolute", top: `${coords.top}px`, left: `${coords.left}px`, width: "320px" }}
      className="z-[9999] rounded-xl border border-border bg-card shadow-xl overflow-hidden font-mono text-xs text-foreground animate-in fade-in zoom-in-95 duration-100"
    >
      {!selectedField && (
        <PaletteFieldListView
          filteredFields={filteredFields}
          highlightedFieldIndex={highlightedFieldIndex}
          fieldListRef={fieldListRef}
          smartParsed={smartParsed}
          onSelectField={handleSelectField}
          onSetHighlightedIndex={setHighlightedFieldIndex}
          onApplySmartParse={onApplySmartParse}
          onSearchQueryChange={onSearchQueryChange}
          onClose={onClose}
        />
      )}

      {selectedField && !selectedOperator && selectedField.key !== "timeRange" && (
        <PaletteOperatorListView
          selectedField={selectedField}
          highlightedOpIndex={highlightedOpIndex}
          opListRef={opListRef}
          onSelectOperator={setSelectedOperator}
          onSetHighlightedIndex={setHighlightedOpIndex}
          onBack={() => setSelectedField(null)}
          onClose={onClose}
        />
      )}

      {selectedField && (selectedOperator || selectedField.key === "timeRange") && (
        <PaletteValueInputView
          selectedField={selectedField}
          selectedOperator={selectedOperator}
          manualValue={manualValue}
          manualInputRef={manualInputRef}
          onChangeManualValue={setManualValue}
          onApplyValue={handleApplyValue}
          onBack={() => {
            if (selectedField.key === "timeRange") setSelectedField(null);
            else setSelectedOperator(null);
          }}
          onClose={onClose}
          onOpenCustomCalendar={onOpenCustomCalendar}
        />
      )}
    </div>,
    document.body
  );
}
