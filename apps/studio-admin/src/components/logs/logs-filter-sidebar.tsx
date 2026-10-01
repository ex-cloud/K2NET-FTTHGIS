import * as React from "react";
import {
  Input,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SecondarySidebarHeader,
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
import { useTranslation } from "@k2net/i18n";

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
  const { t } = useTranslation();
  return (
    <Collapsible defaultOpen={false} className="w-full space-y-1 pt-2 border-t border-border/40">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
        <span className="flex items-center gap-1.5">
          <User className="w-3 h-3 text-primary" /> {t("observability.tenant")}
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
          placeholder={t("observability.filter_by_tenant_slug")}
          className="bg-background border-border/60 text-foreground text-xs h-7 font-mono focus:border-primary"
        />
        {tenantFilter && (
          <button
            type="button"
            onClick={() => setTenantFilter("")}
            className="text-[10px] text-muted-foreground hover:text-rose-400 transition-colors font-mono"
          >
            {t("observability.clear_tenant_filter")}
          </button>
        )}
        <p className="text-[9px] text-muted-foreground/50 italic font-sans leading-tight">
          {t("observability.superadmin_empty_all_tenants")}
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
  const { t } = useTranslation();
  return (
    <Collapsible defaultOpen className="w-full space-y-1 pt-2 border-t border-border/40">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
        <span className="flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-primary" /> {t("observability.level")}
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

const SEVERITY_OPTIONS = [
  { key: "CRITICAL", label: "Critical", badge: "CRIT", color: "text-rose-400", bg: "bg-rose-500/15 border-rose-500/30" },
  { key: "ERROR",    label: "Error",    badge: "ERR",  color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  { key: "WARN",     label: "Warning",  badge: "WARN", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { key: "INFO",     label: "Info",     badge: "INFO", color: "text-sky-400",   bg: "bg-sky-500/10 border-sky-500/20" },
];

const SCOPE_OPTIONS = [
  { key: "ALL",          label: "All Scopes" },
  { key: "SYSTEM",       label: "System Core" },
  { key: "ORGANIZATION", label: "Tenant Org" },
  { key: "PROJECT",      label: "Project Tech" },
];

function ScopeFilterSection({
  scopeFilter,
  setScopeFilter,
  projectFilter,
  setProjectFilter,
}: {
  scopeFilter: string;
  setScopeFilter: (v: string) => void;
  projectFilter: string;
  setProjectFilter: (v: string) => void;
}) {
  return (
    <Collapsible defaultOpen className="w-full space-y-1 pt-2 border-t border-border/40">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
        <span className="flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-primary" /> Scope & Project
        </span>
        <div className="flex items-center gap-1.5">
          {scopeFilter !== "ALL" && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono font-semibold">
              {scopeFilter}
            </span>
          )}
          <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1 space-y-2 font-mono text-[11px]">
        <div className="grid grid-cols-2 gap-1">
          {SCOPE_OPTIONS.map((s) => {
            const isSelected = scopeFilter === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setScopeFilter(s.key)}
                className={`px-2 py-1 rounded text-[10px] border transition-colors text-left truncate ${
                  isSelected
                    ? "bg-primary/15 border-primary/40 text-primary font-semibold"
                    : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-1">
          <Input
            type="text"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            placeholder="Filter Project ID / Name..."
            className="bg-background border-border/60 text-foreground text-xs h-7 font-mono focus:border-primary"
          />
          {projectFilter && (
            <button
              type="button"
              onClick={() => setProjectFilter("")}
              className="text-[10px] text-muted-foreground hover:text-rose-400 transition-colors font-mono"
            >
              Clear project filter
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SeverityFilterSection({
  selectedSeverities,
  toggleSeverity,
}: {
  selectedSeverities: Record<string, boolean>;
  toggleSeverity: (sev: string) => void;
}) {
  return (
    <Collapsible defaultOpen className="w-full space-y-1 pt-2 border-t border-border/40">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-primary" /> Severity Badging
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-muted-foreground/60">
            × {Object.values(selectedSeverities).filter(Boolean).length}
          </span>
          <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 mt-1 font-mono text-[11px]">
        {SEVERITY_OPTIONS.map((sev) => (
          <label
            key={sev.key}
            className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/40 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!selectedSeverities[sev.key]}
                onChange={() => toggleSeverity(sev.key)}
                className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
              />
              <span className="text-muted-foreground">{sev.label}</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold border ${sev.color} ${sev.bg}`}>
              {sev.badge}
            </span>
          </label>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function ImpersonationFilterSection({
  impersonationOnly,
  setImpersonationOnly,
}: {
  impersonationOnly: boolean;
  setImpersonationOnly: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="pt-2 border-t border-border/40">
      <label className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-purple-500/10 cursor-pointer transition-colors group">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={impersonationOnly}
            onChange={(e) => setImpersonationOnly(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-border text-purple-400 focus:ring-purple-400 accent-purple-500 cursor-pointer"
          />
          <span className="text-[11px] font-mono text-muted-foreground group-hover:text-purple-400 transition-colors">
            🎭 Only Impersonated
          </span>
        </div>
        <span className="text-[9px] font-mono text-purple-400/80 px-1 rounded bg-purple-500/15 border border-purple-500/20">
          MFA
        </span>
      </label>
    </div>
  );
}

export interface LogsFilterSidebarProps {
  onCollapse?: () => void;
}

export function LogsFilterSidebar({ onCollapse }: LogsFilterSidebarProps) {
  const { t } = useTranslation();
  const {
    timeRange, setTimeRange,
    selectedTypes, toggleType,
    selectedGroups, toggleGroup,
    selectedLevels, toggleLevel,
    selectedSeverities, toggleSeverity,
    impersonationOnly, setImpersonationOnly,
    scopeFilter, setScopeFilter,
    projectFilter, setProjectFilter,
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
    Object.values(selectedSeverities).some((v) => !v) ||
    impersonationOnly ||
    scopeFilter !== "ALL" ||
    projectFilter.trim().length > 0 ||
    tenantFilter.trim().length > 0;

  return (
    <div className="flex flex-col h-full w-[240px] font-sans text-xs bg-sidebar select-none border-r border-border/60 shrink-0">
      {onCollapse !== undefined && (
        <SecondarySidebarHeader
          title={t("observability.logs_explorer")}
          onCollapse={onCollapse}
          actions={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 cursor-pointer"
                title={t("observability.reset_filter")}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t("observability.reset_filter")}</span>
              </button>
            ) : null
          }
        />
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar-thin p-3 space-y-4">
        <div className="w-full space-y-1">
          <div className="flex items-center justify-between px-1 py-1">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest">
              <Clock className="w-3 h-3 text-primary" /> {t("observability.time_range")}
            </span>
          </div>
          <LogsDateRangePicker value={timeRange} onChange={setTimeRange} />
        </div>

        <TenantFilterSection tenantFilter={tenantFilter} setTenantFilter={setTenantFilter} />

        <ScopeFilterSection
          scopeFilter={scopeFilter}
          setScopeFilter={setScopeFilter}
          projectFilter={projectFilter}
          setProjectFilter={setProjectFilter}
        />

        <SeverityFilterSection
          selectedSeverities={selectedSeverities}
          toggleSeverity={toggleSeverity}
        />

        <ImpersonationFilterSection
          impersonationOnly={impersonationOnly}
          setImpersonationOnly={setImpersonationOnly}
        />

        <Collapsible defaultOpen className="w-full space-y-1 pt-2 border-t border-border/40">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-primary" /> {t("observability.log_type")}
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
                placeholder={t("observability.search")}
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
              <Sliders className="w-3 h-3 text-primary" /> {t("observability.method")}
            </span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
        </Collapsible>

        <Collapsible defaultOpen={false} className="w-full space-y-1 pt-2 border-t border-border/40">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-primary" /> {t("observability.pathname")}
            </span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
        </Collapsible>
      </div>

      <div className="p-3 border-t border-border/40 space-y-1 font-mono text-[10px] shrink-0 bg-card/40">
        <div className="flex items-center gap-1.5 text-foreground font-bold font-sans">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span>{t("observability.capture_your_logs")}</span>
        </div>
        <p className="text-muted-foreground/70 text-[9px] leading-tight font-sans">
          {t("observability.capture_logs_desc")}
        </p>
      </div>
    </div>
  );
}

