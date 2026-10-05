import * as React from "react";
import {
  Input,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SecondarySidebarHeader,
  ActionTooltip,
  Checkbox,
} from "@k2net/ui";
import {
  Search,
  ChevronDown,
  RotateCcw,
  Plus,
  Minus,
} from "lucide-react";
import { useLogsFilter } from "./logs-filter-context";
import { LogsDateRangePicker } from "./logs-date-range-picker";
import { useTranslation } from "@k2net/i18n";
import {
  TenantScopeFilterSection,
  LevelFilterSection,
  SeverityFilterSection,
  BenchmarkFilterSection,
} from "./logs-filter-sections";
import { PresetsFilterSection } from "./logs-presets-section";

export interface SubFilterItem {
  key: string;
  label: string;
}

export interface LogTypeItem {
  key: string;
  label: string;
  subItems?: SubFilterItem[];
}

export const LOG_TYPE_DEFINITIONS: LogTypeItem[] = [
  {
    key: "edge",
    label: "API Gateway",
    subItems: [
      { key: "edge_auth", label: "Auth" },
      { key: "edge_storage", label: "Storage" },
      { key: "edge_tasks", label: "Tasks" },
      { key: "edge_network", label: "GIS Network" },
      { key: "edge_payment", label: "Payment" },
      { key: "edge_ai", label: "AI Copilot" },
    ],
  },
  {
    key: "postgres",
    label: "Postgres",
    subItems: [
      { key: "pg_core", label: "ftth_gis (Core)" },
      { key: "pg_keycloak", label: "Keycloak DB" },
      { key: "pg_spatial", label: "PostGIS Spatial" },
    ],
  },
  {
    key: "auth",
    label: "Auth & IAM",
  },
  {
    key: "storage",
    label: "Storage",
  },
  {
    key: "redis",
    label: "Redis Cache & Queue",
  },
  {
    key: "traefik",
    label: "Traefik Edge Proxy",
  },
  {
    key: "ai",
    label: "AI Copilot",
    subItems: [
      { key: "ai_rag", label: "RAG Search" },
      { key: "ai_audit", label: "Audit Analyzer" },
    ],
  },
  {
    key: "olt",
    label: "OLT Gateway",
    subItems: [
      { key: "olt_poller", label: "Poller SNMP" },
      { key: "olt_cli", label: "CLI Engine" },
      { key: "olt_syslog", label: "Syslog Stream" },
    ],
  },
  {
    key: "poller",
    label: "OLT Poller (SNMP)",
  },
  {
    key: "map",
    label: "Map Gateway",
  },
  {
    key: "martin",
    label: "Martin Tile Server",
  },
  {
    key: "task",
    label: "Task & Sync",
  },
  {
    key: "audit",
    label: "Audit Trail",
  },
  {
    key: "notification",
    label: "Notification Gateway",
  },
  {
    key: "payment",
    label: "Payment Gateway",
  },
  {
    key: "scheduler",
    label: "Scheduler & Backup",
  },
  {
    key: "export",
    label: "Export Gateway",
  },
  {
    key: "whatsapp",
    label: "WhatsApp Gateway",
  },
];

export interface LogsFilterSidebarProps {
  onCollapse?: () => void;
}

export function LogsFilterSidebar(_props: LogsFilterSidebarProps) {
  const { t } = useTranslation();
  const {
    timeRange, setTimeRange,
    selectedTypes, toggleType,
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
  const [expandedTypes, setExpandedTypes] = React.useState<Record<string, boolean>>({
    edge: true,
  });

  const toggleExpand = React.useCallback((key: string) => {
    setExpandedTypes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const hasActiveFilters =
    timeRange !== "60m" ||
    Object.values(selectedTypes).some(Boolean) ||
    Object.values(selectedLevels).some(Boolean) ||
    Object.values(selectedSeverities).some(Boolean) ||
    Object.values(edgeSubFilters).some(Boolean) ||
    scopeFilter !== "ALL" ||
    projectFilter.trim().length > 0 ||
    tenantFilter.trim().length > 0 ||
    includeBenchmark ||
    searchQuery.trim().length > 0 ||
    (advancedFilters && advancedFilters.length > 0);

  const selectedTypeCount = Object.values(selectedTypes).filter(Boolean).length;

  const q = typeSearch.toLowerCase().trim();
  const filteredTypes = React.useMemo(() => {
    if (!q) return LOG_TYPE_DEFINITIONS;
    return LOG_TYPE_DEFINITIONS.filter((item) => {
      const matchLabel = item.label.toLowerCase().includes(q);
      const matchKey = item.key.toLowerCase().includes(q);
      const matchSub = item.subItems?.some(
        (sub) => sub.label.toLowerCase().includes(q) || sub.key.toLowerCase().includes(q)
      );
      return matchLabel || matchKey || matchSub;
    });
  }, [q]);

  return (
    <div className="flex flex-col h-full w-[240px] font-sans text-xs bg-sidebar select-none border-groove-r shrink-0">
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
            <span className="text-[10px] font-bold text-foreground/80 dark:text-foreground uppercase tracking-widest">
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

        {/* LOG TYPE FILTER WITH SUPABASE-STYLE TABLE BORDER & WORKTREE */}
        <Collapsible defaultOpen className="w-full space-y-1 pt-2.5 border-groove-t">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/80 dark:text-foreground uppercase tracking-widest hover:text-foreground group select-none">
            <span>{t("observability.log_type")}</span>
            <div className="flex items-center gap-1.5">
              {selectedTypeCount > 0 && (
                <span className="text-[9px] font-mono text-muted-foreground font-semibold">
                  × {selectedTypeCount}
                </span>
              )}
              <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180 text-muted-foreground/60 group-hover:text-foreground dark:text-muted-foreground/70" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1.5 mt-1">
            <div className="relative">
              <Input
                type="text"
                value={typeSearch}
                onChange={(e) => setTypeSearch(e.target.value)}
                placeholder={t("observability.search") || "Search"}
                className="bg-background border-border/60 text-foreground text-xs h-7 pl-7 font-mono focus:border-border focus-visible:ring-0"
              />
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            </div>

            <div className="rounded-md border border-border/70 bg-card/40 overflow-hidden divide-y divide-border/40 font-mono text-[11px] shadow-2xs max-h-[320px] overflow-y-auto custom-scrollbar-thin">
              {filteredTypes.map((item) => {
                const count = logTypeCounts[item.key] ?? 0;
                const isOn = !!selectedTypes[item.key];
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isExpanded = (q && hasSubItems) ? true : !!expandedTypes[item.key];

                return (
                  <div key={item.key} className="transition-colors">
                    <div
                      onClick={() => toggleType(item.key)}
                      className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/40 transition-colors cursor-pointer group/type select-none"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Checkbox
                          checked={isOn}
                          onCheckedChange={() => toggleType(item.key)}
                          className="size-3.5 rounded-[3px] shrink-0"
                        />
                        <span className="text-muted-foreground group-hover/type:text-foreground transition-colors truncate text-[11px]">
                          {item.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasSubItems && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleExpand(item.key);
                            }}
                            className="w-4 h-4 flex items-center justify-center rounded hover:bg-muted text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer"
                            aria-label={isExpanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                          >
                            {isExpanded ? (
                              <Minus className="w-3 h-3 stroke-[2.5]" />
                            ) : (
                              <Plus className="w-3 h-3 stroke-[2.5]" />
                            )}
                          </button>
                        )}
                        <span className={`text-[10px] font-mono min-w-[14px] text-right ${count > 0 ? "text-foreground font-semibold" : "text-muted-foreground/40"}`}>
                          {count}
                        </span>
                      </div>
                    </div>

                    {/* Worktree Sub-items */}
                    {isExpanded && hasSubItems && (
                      <div className="bg-muted/15 border-t border-border/30 divide-y divide-border/20">
                        {item.subItems!.map((sub, idx) => {
                          const isLast = idx === item.subItems!.length - 1;
                          const isSubChecked = !!edgeSubFilters[sub.key];
                          return (
                            <div
                              key={sub.key}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEdgeSubFilter(sub.key);
                              }}
                              className="relative pl-7 pr-2.5 py-1 hover:bg-muted/30 cursor-pointer transition-colors select-none group/sub flex items-center justify-between"
                            >
                              {/* Tree Line Connector Trunk & Branch */}
                              <div
                                className="absolute left-[17px] top-0 w-[1px] bg-border/60 pointer-events-none"
                                style={{ height: isLast ? "50%" : "100%" }}
                              />
                              <div className="absolute left-[17px] top-1/2 w-2.5 h-[1px] bg-border/60 pointer-events-none" />

                              <div className="flex items-center gap-2 min-w-0">
                                <Checkbox
                                  checked={isSubChecked}
                                  onCheckedChange={() => toggleEdgeSubFilter(sub.key)}
                                  className="size-3 rounded-[2.5px] shrink-0"
                                />
                                <span className="text-[10.5px] text-muted-foreground group-hover/sub:text-foreground transition-colors font-mono truncate">
                                  {sub.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <LevelFilterSection
          selectedLevels={selectedLevels}
          toggleLevel={toggleLevel}
          levelCounts={levelCounts}
        />

        <Collapsible defaultOpen={false} className="w-full space-y-1 pt-2.5 border-groove-t">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/80 dark:text-foreground uppercase tracking-widest hover:text-foreground group select-none">
            <span>{t("observability.method")}</span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180 text-muted-foreground/60 group-hover:text-foreground dark:text-muted-foreground/70" />
          </CollapsibleTrigger>
        </Collapsible>

        <Collapsible defaultOpen={false} className="w-full space-y-1 pt-2.5 border-groove-t">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/80 dark:text-foreground uppercase tracking-widest hover:text-foreground group select-none">
            <span>{t("observability.pathname")}</span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180 text-muted-foreground/60 group-hover:text-foreground dark:text-muted-foreground/70" />
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
