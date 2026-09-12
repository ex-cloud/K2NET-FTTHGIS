import * as React from "react";
import {
  Input,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@k2net/ui";
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
} from "lucide-react";
import { useLogsFilter, DEFAULT_SELECTED_TYPES, LOG_GROUPS, type LogGroupKey } from "./logs-filter-context";
import { LogsDateRangePicker } from "./logs-date-range-picker";

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

const GROUP_ICONS: Record<LogGroupKey, React.ElementType> = {
  CORE:       Server,
  OPERATIONS: Briefcase,
  NETWORK:    Network,
  MESSAGING:  MessageSquare,
};

const LEVEL_OPTIONS = [
  { key: "success", label: "Success", badge: "2xx", color: "text-primary/80", bg: "bg-primary/10" },
  { key: "warning", label: "Warning", badge: "4xx", color: "text-amber-400",   bg: "bg-amber-500/10" },
  { key: "error",   label: "Error",   badge: "5xx", color: "text-rose-400",    bg: "bg-rose-500/10"  },
];

const EDGE_SUB_FILTERS = [
  { key: "edge_api",     label: "REST API" },
  { key: "edge_webhook", label: "Webhooks" },
  { key: "edge_proxy",   label: "Go Gateway Proxy" },
];

function getLogTypeLabel(typeKey: string): string {
  const labels: Record<string, string> = {
    edge: "API Gateway (Kong)",
    auth: "Auth & Security",
    postgres: "Postgres (Envers)",
    audit: "Audit Trail",
    notification: "Notification",
    scheduler: "Scheduler",
    storage: "Storage",
    export: "Export",
    payment: "Payment",
    olt: "OLT Gateway",
    poller: "OLT Poller",
    map: "Map Gateway",
    whatsapp: "WhatsApp",
  };
  return labels[typeKey] || typeKey;
}

function TenantFilterSection({
  tenantFilter,
  setTenantFilter,
}: {
  tenantFilter: string;
  setTenantFilter: (v: string) => void;
}) {
  return (
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
            type="button"
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
  );
}

function LevelFilterSection({
  selectedLevels,
  toggleLevel,
}: {
  selectedLevels: Record<string, boolean>;
  toggleLevel: (lvl: string) => void;
}) {
  return (
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
  );
}

function LogGroupRowItem({
  groupKey,
  typeSearch,
  selectedGroups,
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
  const GroupIcon = GROUP_ICONS[groupKey];
  const q = typeSearch.toLowerCase().trim();
  const visibleTypes = group.types.filter((t) => !q || t.toLowerCase().includes(q));
  if (visibleTypes.length === 0) return null;

  const activeCount = group.types.filter((t) => selectedTypes[t]).length;
  const eventCount = group.types.reduce((sum, t) => sum + (logTypeCounts[t] ?? 0), 0);
  const isGroupOn = selectedGroups[groupKey];

  return (
    <Collapsible defaultOpen={isGroupOn} className="w-full">
      <div className="flex items-center gap-1.5 px-1 py-1 rounded hover:bg-muted/30 transition-colors">
        <input
          type="checkbox"
          checked={isGroupOn}
          onChange={() => toggleGroup(groupKey)}
          className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
          title={`Toggle all ${group.label}`}
        />
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
                      {getLogTypeLabel(typeKey)}
                    </span>
                  </div>
                  {count > 0 && (
                    <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">{count}</span>
                  )}
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
}

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

  const hasActiveFilters =
    Object.keys(DEFAULT_SELECTED_TYPES).some(
      (k) => selectedTypes[k] !== DEFAULT_SELECTED_TYPES[k]
    ) ||
    Object.values(selectedLevels).some((v) => !v) ||
    tenantFilter.trim().length > 0;

  return (
    <div className="flex flex-col h-full w-[240px] font-sans text-xs bg-sidebar select-none border-r border-border/60 shrink-0">
      {onCollapse !== undefined && (
        <div className="py-3.5 border-b border-border/40 shrink-0 flex items-center justify-between px-4 min-w-[240px]">
          <h3 className="text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest">
            Logs Explorer
          </h3>
          {hasActiveFilters && (
            <button
              type="button"
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

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar-thin p-3 space-y-4">
        <div className="w-full space-y-1">
          <div className="flex items-center justify-between px-1 py-1">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest">
              <Clock className="w-3 h-3 text-primary" /> Time Range
            </span>
          </div>
          <LogsDateRangePicker value={timeRange} onChange={setTimeRange} />
        </div>

        <TenantFilterSection tenantFilter={tenantFilter} setTenantFilter={setTenantFilter} />

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

        <LevelFilterSection selectedLevels={selectedLevels} toggleLevel={toggleLevel} />

        <Collapsible defaultOpen={false} className="w-full space-y-1 pt-2 border-t border-border/40">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-primary" /> Method
            </span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
        </Collapsible>

        <Collapsible defaultOpen={false} className="w-full space-y-1 pt-2 border-t border-border/40">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-primary" /> Pathname
            </span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
        </Collapsible>
      </div>

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
