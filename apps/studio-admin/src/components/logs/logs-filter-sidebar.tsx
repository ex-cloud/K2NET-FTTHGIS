"use client";

import * as React from "react";
import { Input } from "@k2net/ui";
import {
  Search,
  Clock,
  Layers,
  Filter,
  ChevronDown,
  ChevronRight,
  User,
  Activity,
  Globe,
  Sliders,
  RotateCcw,
  Shield,
  Bell,
  Radio,
  CalendarClock,
  HardDrive,
  Database,
  Map,
  Network,
  Server,
  Briefcase,
  MessageSquare,
  CreditCard,
  FileOutput,
  Wifi,
  ChevronUp,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@k2net/ui";
import { useLogsFilter, DEFAULT_SELECTED_TYPES, LOG_GROUPS, LogGroupKey } from "./logs-filter-context";
import { LogsDateRangePicker } from "./logs-date-range-picker";

// ─── Log type definitions per group ──────────────────────────────────────────

const LOG_TYPE_CONFIG: Record<string, { icon: React.ElementType; description: string }> = {
  edge:         { icon: Network,      description: "HTTP logs routed via Kong" },
  auth:         { icon: Shield,       description: "Keycloak, access denials, rate limits" },
  postgres:     { icon: Database,     description: "PostGIS spatial audit via Hibernate Envers" },
  audit:        { icon: Layers,       description: "Tenant resource changes via gateway-audit" },
  notification: { icon: Bell,         description: "SMS & email send logs" },
  scheduler:    { icon: CalendarClock,description: "Scheduled job execution history" },
  storage:      { icon: HardDrive,    description: "MinIO upload/presigned URL operations" },
  export:       { icon: FileOutput,   description: "GIS data export jobs" },
  payment:      { icon: CreditCard,   description: "Xendit payment & webhook events" },
  olt:          { icon: Wifi,         description: "OLT device ops, ONT provisioning" },
  poller:       { icon: Radio,        description: "SNMP device health checks" },
  map:          { icon: Map,          description: "Geocoding & vector tile requests" },
  whatsapp:     { icon: MessageSquare,description: "WhatsApp Business API messages" },
};

// Group icon mapping
const GROUP_ICONS: Record<LogGroupKey, React.ElementType> = {
  CORE:       Server,
  OPERATIONS: Briefcase,
  NETWORK:    Network,
  MESSAGING:  MessageSquare,
};

// Level display config
const LEVEL_OPTIONS = [
  { key: "success", label: "Success", badge: "2xx", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { key: "warning", label: "Warning", badge: "4xx", color: "text-amber-400",   bg: "bg-amber-500/10"   },
  { key: "error",   label: "Error",   badge: "5xx", color: "text-rose-400",    bg: "bg-rose-500/10"    },
];

// Edge sub-filters (nested under Kong)
const EDGE_SUB_FILTERS = [
  { key: "edge_api",     label: "REST API" },
  { key: "edge_webhook", label: "Webhooks" },
  { key: "edge_proxy",   label: "Go Gateway Proxy" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export interface LogsFilterSidebarProps {
  onCollapse?: () => void;
}

export function LogsFilterSidebar({ onCollapse }: LogsFilterSidebarProps) {
  const {
    timeRange, setTimeRange,
    selectedTypes, toggleType,
    selectedGroups, toggleGroup,
    selectedLevels, toggleLevel,
    edgeSubFilters, toggleEdgeSubFilter,
    resetAllFilters,
    logTypeCounts,
    tenantFilter, setTenantFilter,
  } = useLogsFilter();

  const [typeSearch, setTypeSearch] = React.useState("");

  // Detect if filters differ from default
  const hasActiveFilters =
    Object.keys(DEFAULT_SELECTED_TYPES).some(
      (k) => selectedTypes[k] !== DEFAULT_SELECTED_TYPES[k]
    ) ||
    Object.values(selectedLevels).some((v) => !v) ||
    tenantFilter.trim().length > 0;

  // Count total active types within a group
  const countActiveInGroup = (groupKey: LogGroupKey) => {
    const groupTypes = LOG_GROUPS[groupKey].types;
    return groupTypes.filter((t) => selectedTypes[t]).length;
  };

  // Total events in a group (for badge)
  const countEventsInGroup = (groupKey: LogGroupKey) => {
    const groupTypes = LOG_GROUPS[groupKey].types;
    return groupTypes.reduce((sum, t) => sum + (logTypeCounts[t] ?? 0), 0);
  };

  // Filter types by search query
  const matchesSearch = (typeKey: string) => {
    if (!typeSearch.trim()) return true;
    const label = typeKey.toLowerCase();
    const q = typeSearch.toLowerCase();
    return label.includes(q);
  };

  return (
    <div className="flex flex-col h-full w-[240px] font-sans text-xs bg-sidebar select-none border-r border-border/60 shrink-0">

      {/* Sidebar Title Header */}
      {onCollapse !== undefined && (
        <div className="py-3.5 border-b border-border/40 shrink-0 flex items-center justify-between px-4 min-w-[240px]">
          <h3 className="text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest">
            Logs Explorer
          </h3>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      )}

      {/* Scrollable filter content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">

        {/* ─── Time Range ─── */}
        <div className="w-full space-y-1">
          <div className="flex items-center justify-between px-1 py-1">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest">
              <Clock className="w-3 h-3 text-primary" /> Time Range
            </span>
          </div>
          <LogsDateRangePicker value={timeRange} onChange={setTimeRange} />
        </div>

        {/* ─── Tenant Filter (Super Admin) ─── */}
        <Collapsible defaultOpen={false} className="w-full space-y-1 pt-2 border-t border-border/40">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
            <span className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-primary" /> Tenant
            </span>
            <div className="flex items-center gap-1.5">
              {tenantFilter && (
                <span className="text-[9px] px-1 rounded bg-primary/20 text-primary font-mono">
                  {tenantFilter}
                </span>
              )}
              <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-1 space-y-1">
            <Input
              type="text"
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              placeholder="Filter by tenant slug..."
              className="bg-background border-border/60 text-foreground text-xs h-7 font-mono focus:border-primary"
            />
            {tenantFilter && (
              <button
                onClick={() => setTenantFilter("")}
                className="text-[10px] text-muted-foreground hover:text-rose-400 transition-colors font-mono"
              >
                × clear tenant filter
              </button>
            )}
            <p className="text-[9px] text-muted-foreground/50 italic font-sans leading-tight">
              Super Admin: empty = all tenants visible
            </p>
          </CollapsibleContent>
        </Collapsible>

        {/* ─── Log Type (Grouped) ─── */}
        <Collapsible defaultOpen className="w-full space-y-1 pt-2 border-t border-border/40">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-primary" /> Log Type
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono text-muted-foreground/60">
                × {Object.values(selectedTypes).filter(Boolean).length}
              </span>
              <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1.5 mt-1">

            {/* Type search */}
            <div className="relative">
              <Input
                type="text"
                value={typeSearch}
                onChange={(e) => setTypeSearch(e.target.value)}
                placeholder="Search..."
                className="bg-background border-border/60 text-foreground text-xs h-7 pl-7 font-mono focus:border-primary"
              />
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            </div>

            {/* Groups */}
            <div className="space-y-1 font-mono text-[11px]">
              {(Object.keys(LOG_GROUPS) as LogGroupKey[]).map((groupKey) => {
                const group = LOG_GROUPS[groupKey];
                const GroupIcon = GROUP_ICONS[groupKey];
                const visibleTypes = group.types.filter(matchesSearch);
                if (visibleTypes.length === 0) return null;

                const activeCount = countActiveInGroup(groupKey);
                const eventCount = countEventsInGroup(groupKey);
                const isGroupOn = selectedGroups[groupKey];

                return (
                  <Collapsible key={groupKey} defaultOpen={isGroupOn} className="w-full">
                    {/* Group Header Row */}
                    <div className="flex items-center gap-1.5 px-1 py-1 rounded hover:bg-muted/30 transition-colors">
                      {/* Group toggle checkbox */}
                      <input
                        type="checkbox"
                        checked={isGroupOn}
                        onChange={() => toggleGroup(groupKey)}
                        className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
                        title={`Toggle all ${group.label}`}
                      />
                      {/* Collapsible trigger for the group label */}
                      <CollapsibleTrigger className="flex flex-1 items-center justify-between min-w-0 group/grp">
                        <span className={`flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider ${group.color}`}>
                          <GroupIcon className="w-3 h-3 shrink-0" />
                          <span className="truncate">{group.label}</span>
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {eventCount > 0 && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${group.color} ${group.accentBg}`}>
                              {eventCount}
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

                    {/* Group children — individual log types */}
                    <CollapsibleContent>
                      <div className="ml-5 mt-0.5 space-y-0.5 border-l border-border/40 pl-2">
                        {visibleTypes.map((typeKey) => {
                          const cfg = LOG_TYPE_CONFIG[typeKey];
                          const TypeIcon = cfg?.icon ?? Activity;
                          const count = logTypeCounts[typeKey] ?? 0;
                          const isOn = !!selectedTypes[typeKey];

                          return (
                            <div key={typeKey}>
                              <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted/40 cursor-pointer transition-colors group/type">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isOn}
                                    onChange={() => toggleType(typeKey)}
                                    className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                                  />
                                  <TypeIcon className="w-3 h-3 text-muted-foreground/50 group-hover/type:text-foreground/70 shrink-0" />
                                  <span className="text-muted-foreground group-hover/type:text-foreground transition-colors truncate max-w-[100px]">
                                    {typeKey === "edge" ? "API Gateway (Kong)" :
                                     typeKey === "auth" ? "Auth & Security" :
                                     typeKey === "postgres" ? "Postgres (Envers)" :
                                     typeKey === "audit" ? "Audit Trail" :
                                     typeKey === "notification" ? "Notification" :
                                     typeKey === "scheduler" ? "Scheduler" :
                                     typeKey === "storage" ? "Storage" :
                                     typeKey === "export" ? "Export" :
                                     typeKey === "payment" ? "Payment" :
                                     typeKey === "olt" ? "OLT Gateway" :
                                     typeKey === "poller" ? "OLT Poller" :
                                     typeKey === "map" ? "Map Gateway" :
                                     typeKey === "whatsapp" ? "WhatsApp" :
                                     typeKey}
                                  </span>
                                </div>
                                {count > 0 && (
                                  <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                                    {count}
                                  </span>
                                )}
                              </label>

                              {/* Nested sub-filters for "edge" (Kong) */}
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
                                        onChange={() => toggleEdgeSubFilter(sub.key)}
                                        className="w-3 h-3 rounded border-border text-primary accent-primary cursor-pointer"
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
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ─── Level ─── */}
        <Collapsible defaultOpen className="w-full space-y-1 pt-2 border-t border-border/40">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-primary" /> Level
            </span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0.5 mt-1 font-mono text-[11px]">
            {LEVEL_OPTIONS.map((lvl) => (
              <label
                key={lvl.key}
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!selectedLevels[lvl.key]}
                    onChange={() => toggleLevel(lvl.key)}
                    className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <span className="text-muted-foreground">{lvl.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${lvl.color} ${lvl.bg}`}>
                    {lvl.badge}
                  </span>
                </div>
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* ─── Method Filter ─── */}
        <Collapsible defaultOpen={false} className="w-full space-y-1 pt-2 border-t border-border/40">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-primary" /> Method
            </span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
        </Collapsible>

        {/* ─── Pathname Filter ─── */}
        <Collapsible defaultOpen={false} className="w-full space-y-1 pt-2 border-t border-border/40">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-primary" /> Pathname
            </span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
        </Collapsible>

      </div>

      {/* Bottom info card */}
      <div className="p-3 border-t border-border/40 space-y-1 font-mono text-[10px] shrink-0 bg-card/40">
        <div className="flex items-center gap-1.5 text-foreground font-bold font-sans">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span>Capture your logs</span>
        </div>
        <p className="text-muted-foreground/70 text-[9px] leading-tight font-sans">
          Send logs to your preferred observability or storage platform.
        </p>
      </div>
    </div>
  );
}
