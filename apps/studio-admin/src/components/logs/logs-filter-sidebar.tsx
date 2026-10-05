import * as React from "react";
import {
  Input,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SecondarySidebarHeader,
  ActionTooltip,
} from "@k2net/ui";
import {
  Search,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  useLogsFilter,
  LOG_GROUPS,
  LOG_TYPES_LABELS,
  type LogGroupKey,
} from "./logs-filter-context";
import { LogsDateRangePicker } from "./logs-date-range-picker";
import { useTranslation } from "@k2net/i18n";
import {
  TenantScopeFilterSection,
  LevelFilterSection,
  SeverityFilterSection,
  BenchmarkFilterSection,
} from "./logs-filter-sections";
import { PresetsFilterSection } from "./logs-presets-section";

const EDGE_SUB_FILTERS = [
  { key: "edge_auth", label: "Auth (/auth)" },
  { key: "edge_storage", label: "Storage (/storage)" },
  { key: "edge_tasks", label: "Tasks (/tasks)" },
  { key: "edge_network", label: "GIS (/network)" },
  { key: "edge_payment", label: "Payment (/payment)" },
  { key: "edge_ai", label: "AI (/ai)" },
];

const getLogTypeLabel = (typeKey: string): string => LOG_TYPES_LABELS[typeKey] || typeKey;

function LogGroupRowItem({
  groupKey,
  typeSearch,
  selectedGroups: _selectedGroups,
  toggleGroup,
  selectedTypes,
  toggleType,
  logTypeCounts,
  edgeSubFilters,
  toggleEdgeSubFilter,
}: {
  groupKey: LogGroupKey;
  typeSearch: string;
  selectedGroups: Record<string, boolean>;
  toggleGroup: (g: LogGroupKey) => void;
  selectedTypes: Record<string, boolean>;
  toggleType: (t: string) => void;
  logTypeCounts: Record<string, number>;
  edgeSubFilters: Record<string, boolean>;
  toggleEdgeSubFilter: (s: string) => void;
}) {
  const group = LOG_GROUPS[groupKey];
  const q = typeSearch.toLowerCase().trim();
  const visibleTypes = group.types.filter((t) => !q || t.toLowerCase().includes(q));
  if (visibleTypes.length === 0) return null;

  const activeCount = group.types.filter((t) => selectedTypes[t]).length;
  const eventCount = group.types.reduce((sum, t) => sum + (logTypeCounts[t] ?? 0), 0);
  const isAllChecked = group.types.length > 0 && group.types.every((t) => !!selectedTypes[t]);
  const isPartiallyChecked = activeCount > 0 && !isAllChecked;

  return (
    <Collapsible defaultOpen={activeCount > 0} className="w-full">
      <div className="flex items-center gap-1.5 px-1 py-1 rounded hover:bg-muted/30 transition-colors">
        <input
          type="checkbox"
          checked={isAllChecked}
          ref={(el) => {
            if (el) {
              el.indeterminate = isPartiallyChecked;
            }
          }}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleGroup(groupKey)}
          className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
          title={`Toggle all ${group.label}`}
        />
        <CollapsibleTrigger className="flex flex-1 items-center justify-between min-w-0 group/grp select-none">
          <span className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground group-hover/grp:text-foreground transition-colors truncate">
            {group.label}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {eventCount > 0 ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold bg-muted/40 text-foreground/80 border border-border/40">
                {eventCount}
              </span>
            ) : (
              <span className="text-[9px] font-mono text-muted-foreground/40">
                0
              </span>
            )}
            {activeCount > 0 && (
              <span className="text-[9px] text-muted-foreground/50 font-mono">
                {activeCount}/{group.types.length}
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-muted-foreground/40 transition-transform duration-200 group-data-[state=open]/grp:rotate-180" />
          </div>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <div className="ml-5 mt-0.5 space-y-0.5 border-l border-border/40 pl-2">
          {visibleTypes.map((typeKey) => {
            const count = logTypeCounts[typeKey] ?? 0;
            const isOn = !!selectedTypes[typeKey];

            return (
              <div key={typeKey}>
                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted/40 cursor-pointer transition-colors group/type">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isOn}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleType(typeKey)}
                      className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
                    />
                    <span className="text-muted-foreground group-hover/type:text-foreground transition-colors truncate text-[11px]">
                      {getLogTypeLabel(typeKey)}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono shrink-0 ${count > 0 ? "text-foreground font-semibold" : "text-muted-foreground/40"}`}>
                    {count}
                  </span>
                </label>

                {typeKey === "edge" && isOn && (
                  <div className="ml-5 mt-0.5 space-y-0.5 border-l border-border/30 pl-2">
                    {EDGE_SUB_FILTERS.map((sub) => (
                      <label
                        key={sub.key}
                        className="flex items-center gap-2 px-2 py-0.5 rounded hover:bg-muted/30 cursor-pointer transition-colors group/sub"
                      >
                        <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/40 shrink-0" />
                        <input
                          type="checkbox"
                          checked={!!edgeSubFilters[sub.key]}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleEdgeSubFilter(sub.key)}
                          className="w-3 h-3 rounded border-border text-primary accent-primary cursor-pointer shrink-0"
                        />
                        <span className="text-[10px] text-muted-foreground/70 group-hover/sub:text-foreground transition-colors font-mono">
                          {sub.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export interface LogsFilterSidebarProps {
  onCollapse?: () => void;
}

export function LogsFilterSidebar(_props: LogsFilterSidebarProps) {
  const { t } = useTranslation();
  const {
    timeRange, setTimeRange,
    selectedTypes, toggleType,
    selectedGroups, toggleGroup,
    selectedLevels, toggleLevel,
    selectedSeverities, toggleSeverity,
    scopeFilter, setScopeFilter,
    projectFilter,
    edgeSubFilters, toggleEdgeSubFilter,
    resetAllFilters,
    logTypeCounts,
    levelCounts,
    severityCounts,
    tenantFilter, setTenantFilter,
    includeBenchmark, setIncludeBenchmark,
    searchQuery,
    advancedFilters,
  } = useLogsFilter();

  const [typeSearch, setTypeSearch] = React.useState("");

  const hasActiveFilters =
    timeRange !== "60m" ||
    Object.values(selectedTypes).some(Boolean) ||
    Object.values(selectedLevels).some(Boolean) ||
    Object.values(selectedGroups).some(Boolean) ||
    Object.values(selectedSeverities).some(Boolean) ||
    Object.values(edgeSubFilters).some(Boolean) ||
    scopeFilter !== "ALL" ||
    projectFilter.trim().length > 0 ||
    tenantFilter.trim().length > 0 ||
    includeBenchmark ||
    searchQuery.trim().length > 0 ||
    (advancedFilters && advancedFilters.length > 0);

  const selectedTypeCount = Object.values(selectedTypes).filter(Boolean).length;

  return (
    <div className="flex flex-col h-full w-[240px] font-sans text-xs bg-sidebar select-none border-r border-border/60 shrink-0">
      <SecondarySidebarHeader
        title={t("observability.logs_explorer")}
        actions={
          hasActiveFilters ? (
            <ActionTooltip label={t("observability.reset_filter") || "Reset filter"}>
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{t("common.reset") || "Reset"}</span>
              </button>
            </ActionTooltip>
          ) : null
        }
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar-thin p-3 space-y-4">
        <div className="w-full space-y-1">
          <div className="flex items-center justify-between px-1 py-1">
            <span className="text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest">
              {t("observability.time_range")}
            </span>
          </div>
          <LogsDateRangePicker value={timeRange} onChange={setTimeRange} />
        </div>

        <PresetsFilterSection />

        <SeverityFilterSection
          selectedSeverities={selectedSeverities}
          toggleSeverity={toggleSeverity}
          severityCounts={severityCounts}
        />

        <TenantScopeFilterSection
          scopeFilter={scopeFilter}
          setScopeFilter={setScopeFilter}
          tenantFilter={tenantFilter}
          setTenantFilter={setTenantFilter}
        />

        <Collapsible defaultOpen className="w-full space-y-1 pt-2 border-t border-border/40">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group select-none">
            <span>{t("observability.log_type")}</span>
            <div className="flex items-center gap-1.5">
              {selectedTypeCount > 0 && (
                <span className="text-[9px] font-mono text-muted-foreground font-semibold">
                  × {selectedTypeCount}
                </span>
              )}
              <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180 text-muted-foreground/40" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1.5 mt-1">
            <div className="relative">
              <Input
                type="text"
                value={typeSearch}
                onChange={(e) => setTypeSearch(e.target.value)}
                placeholder={t("observability.search")}
                className="bg-background border-border/60 text-foreground text-xs h-7 pl-7 font-mono focus:border-border focus-visible:ring-0"
              />
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            </div>

            <div className="space-y-1 font-mono text-[11px] max-h-[260px] overflow-y-auto overflow-x-hidden custom-scrollbar-thin pr-1">
              {(Object.keys(LOG_GROUPS) as LogGroupKey[]).map((groupKey) => (
                <LogGroupRowItem
                  key={groupKey}
                  groupKey={groupKey}
                  typeSearch={typeSearch}
                  selectedGroups={selectedGroups}
                  toggleGroup={toggleGroup}
                  selectedTypes={selectedTypes}
                  toggleType={toggleType}
                  logTypeCounts={logTypeCounts}
                  edgeSubFilters={edgeSubFilters}
                  toggleEdgeSubFilter={toggleEdgeSubFilter}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <LevelFilterSection
          selectedLevels={selectedLevels}
          toggleLevel={toggleLevel}
          levelCounts={levelCounts}
        />

        <Collapsible defaultOpen={false} className="w-full space-y-1 pt-2 border-t border-border/40">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group select-none">
            <span>{t("observability.method")}</span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180 text-muted-foreground/40" />
          </CollapsibleTrigger>
        </Collapsible>

        <Collapsible defaultOpen={false} className="w-full space-y-1 pt-2 border-t border-border/40">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group select-none">
            <span>{t("observability.pathname")}</span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180 text-muted-foreground/40" />
          </CollapsibleTrigger>
        </Collapsible>

        <BenchmarkFilterSection
          includeBenchmark={includeBenchmark}
          setIncludeBenchmark={setIncludeBenchmark}
        />
      </div>
    </div>
  );
}
