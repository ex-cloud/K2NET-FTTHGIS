import * as React from "react";
import {
  LogsFilterPaletteCore,
  type AppliedFilter,
  type FilterFieldConfig as CoreFilterFieldConfig,
  type SmartParseResult as CoreSmartParseResult,
} from "@k2net/ui";
import {
  type AdvancedFilter,
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
  return (
    <LogsFilterPaletteCore
      fields={FILTER_FIELD_CONFIGS}
      anchorRef={anchorRef}
      searchQuery={searchQuery}
      onSearchQueryChange={onSearchQueryChange}
      onClose={onClose}
      onApplyFilter={(f: AppliedFilter) => {
        onApplyFilter(f as AdvancedFilter);
      }}
      onSelectTimeRange={onSelectTimeRange}
      onOpenCustomCalendar={onOpenCustomCalendar}
      onApplySmartParse={(parsed: CoreSmartParseResult) => {
        onApplySmartParse(parsed as SmartParseResult);
      }}
      smartParser={(q: string) => parseSmartFilter(q)}
      initialField={initialField}
      onFieldSelectedChange={(field: CoreFilterFieldConfig | null) => {
        onFieldSelectedChange?.(field as FilterFieldConfig | null);
      }}
      operatorSymbols={OPERATOR_SYMBOLS}
    />
  );
}
