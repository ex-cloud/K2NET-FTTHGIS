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
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@k2net/ui";
import { useLogsFilter, DEFAULT_SELECTED_TYPES } from "./logs-filter-context";

// K2NET real service log types — aligned with running containers
const LOG_TYPES = [
  {
    key: "edge",
    label: "API Gateway (Kong)",
    icon: Network,
    count: 0,
    description: "HTTP request & response logs routed via Kong",
    nested: [
      { key: "edge_api",     label: "REST API" },
      { key: "edge_webhook", label: "Webhooks" },
      { key: "edge_proxy",   label: "Go Gateway Proxy" },
    ],
  },
  { key: "auth",         label: "Auth & Security",    icon: Shield,       count: 0, description: "Keycloak auth events, access denials, rate limits" },
  { key: "audit",        label: "Audit Trail",         icon: Layers,       count: 0, description: "Tenant resource changes via gateway-audit" },
  { key: "notification", label: "Notification",        icon: Bell,         count: 0, description: "SMS, WhatsApp, email send logs (Twilio/SMTP)" },
  { key: "poller",       label: "OLT Poller",          icon: Radio,        count: 0, description: "SNMP device health checks via ftth-poller" },
  { key: "scheduler",    label: "Scheduler",           icon: CalendarClock, count: 0, description: "Scheduled job execution history" },
  { key: "olt",          label: "OLT Gateway",         icon: Activity,     count: 0, description: "OLT device operations, ONT provisioning" },
  { key: "postgres",     label: "Postgres (Envers)",   icon: Database,     count: 0, description: "PostGIS spatial query audit via Hibernate Envers" },
  { key: "storage",      label: "Storage Gateway",     icon: HardDrive,    count: 0, description: "MinIO upload/presigned URL operations" },
  { key: "map",          label: "Map Gateway",         icon: Map,          count: 0, description: "Geocoding & vector tile server requests" },
];

// Level config (from getLevelLabel() audit)
const LEVEL_OPTIONS = [
  { key: "success", label: "Success", badge: "2xx", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { key: "warning", label: "Warning", badge: "4xx", color: "text-amber-400",   bg: "bg-amber-500/10"   },
  { key: "error",   label: "Error",   badge: "5xx", color: "text-rose-400",    bg: "bg-rose-500/10"    },
];

export interface LogsFilterSidebarProps {
  onCollapse?: () => void;
}

export function LogsFilterSidebar({ onCollapse }: LogsFilterSidebarProps) {
  const {
    timeRange,
    setTimeRange,
    selectedTypes,
    toggleType,
    selectedLevels,
    toggleLevel,
    edgeSubFilters,
    toggleEdgeSubFilter,
    resetAllFilters,
    logTypeCounts,
  } = useLogsFilter();

  const [typeSearch, setTypeSearch] = React.useState("");

  const filteredLogTypes = LOG_TYPES.filter((t) =>
    t.label.toLowerCase().includes(typeSearch.toLowerCase())
  );

  // Detect if user has made custom changes vs the default filter state
  // Compare each type against its DEFAULT value — not just checking for any false value
  const hasActiveFilters =
    Object.keys(DEFAULT_SELECTED_TYPES).some(
      (k) => selectedTypes[k] !== DEFAULT_SELECTED_TYPES[k]
    ) ||
    Object.values(selectedLevels).some((v) => !v);

  return (
    <div className="flex flex-col h-full w-[240px] font-sans text-xs bg-sidebar select-none border-r border-border/60 shrink-0">

      {/* Sidebar Title Header — Collapse is handled by PanelLeft in the top header */}
      {onCollapse !== undefined && (
        <div className="py-3.5 border-b border-border/40 shrink-0 flex items-center justify-between px-4 min-w-[240px]">
          <h3 className="text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest">
            Logs Explorer
          </h3>
          {/* Only show Reset when filters are active — no double collapse icon */}
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

      {/* Filter Options Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">

        {/* ─── Time Range ─── */}
        <Collapsible defaultOpen className="w-full space-y-1">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-primary" /> Time Range
            </span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-1">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full bg-background border border-border/60 text-foreground text-xs rounded-lg px-2.5 py-1.5 focus:border-primary outline-none font-mono"
            >
              <option value="15m">Last 15 minutes</option>
              <option value="1h">Last 60 minutes</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="custom">Custom Range...</option>
            </select>
          </CollapsibleContent>
        </Collapsible>

        {/* ─── Log Type ─── */}
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
          <CollapsibleContent className="space-y-2 mt-1">
            {/* Search box */}
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

            {/* Log type list */}
            <div className="space-y-0.5 font-mono text-[11px] max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {filteredLogTypes.map((type) => (
                <div key={type.key}>
                  {/* Main log type row */}
                  <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted/40 cursor-pointer transition-colors group">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!selectedTypes[type.key]}
                        onChange={() => toggleType(type.key)}
                        className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                        {type.label}
                      </span>
                    </div>
                    {/* Show count badge only when > 0 */}
                    {(logTypeCounts[type.key] ?? 0) > 0 && (
                      <span className="text-[10px] font-mono text-muted-foreground/60">
                        {logTypeCounts[type.key]}
                      </span>
                    )}
                  </label>

                  {/* Nested sub-filters for "edge" (API Gateway) */}
                  {type.nested && selectedTypes[type.key] && (
                    <div className="ml-5 mt-0.5 space-y-0.5 border-l border-border/40 pl-2">
                      {type.nested.map((sub) => (
                        <label
                          key={sub.key}
                          className="flex items-center gap-2 px-2 py-0.5 rounded hover:bg-muted/30 cursor-pointer transition-colors group"
                        >
                          <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/40 shrink-0" />
                          <input
                            type="checkbox"
                            checked={!!edgeSubFilters[sub.key]}
                            onChange={() => toggleEdgeSubFilter(sub.key)}
                            className="w-3 h-3 rounded border-border text-primary accent-primary cursor-pointer"
                          />
                          <span className="text-[10px] text-muted-foreground/70 group-hover:text-foreground transition-colors font-mono">
                            {sub.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
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

        {/* ─── User Filter ─── */}
        <Collapsible defaultOpen={false} className="w-full space-y-1 pt-2 border-t border-border/40">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
            <span className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-primary" /> User
            </span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-1 space-y-2">
            <Input
              type="text"
              placeholder="Search by email or id"
              className="bg-background border-border/60 text-foreground text-xs h-7 font-mono focus:border-primary"
            />
            <p className="text-[10px] text-muted-foreground/60 italic text-center py-1 font-mono">No users found</p>
          </CollapsibleContent>
        </Collapsible>

        {/* ─── Status Filter ─── */}
        <Collapsible defaultOpen={false} className="w-full space-y-1 pt-2 border-t border-border/40">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-primary" /> Status
            </span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-1">
            <p className="text-[10px] text-muted-foreground/60 italic text-center py-1 font-mono">No options available</p>
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

      {/* Bottom Capture Logs Card */}
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
