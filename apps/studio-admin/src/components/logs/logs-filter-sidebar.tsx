"use client";

import * as React from "react";
import { Badge, Input } from "@k2net/ui";
import {
  Search,
  Clock,
  Layers,
  Filter,
  PanelLeftClose,
  ChevronDown,
  Database,
  Building2,
  KeyRound,
  Cpu,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@k2net/ui";
import { useLogsFilter } from "./logs-filter-context";

export function LogsFilterSidebar({ onCollapse }: { onCollapse?: () => void }) {
  const {
    searchQuery,
    setSearchQuery,
    timeRange,
    setTimeRange,
    isLivePaused,
    selectedTypes,
    toggleType,
    selectedLevels,
    toggleLevel,
  } = useLogsFilter();

  return (
    <div className="flex flex-col h-full w-full font-sans text-xs bg-sidebar select-none">
      {/* Title with Toggle */}
      <div className="py-4 border-b border-border/40 shrink-0 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground tracking-tight">Logs</h3>
          <Badge className="text-[9px] px-1.5 py-0 font-mono border-primary/20 bg-primary/10 text-primary">
            EXPLORER
          </Badge>
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Options Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        
        {/* Full-Text Search Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Search className="w-3 h-3 text-primary" /> Filter Text
          </label>
          <div className="relative">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search OLT, IP, actor..."
              className="bg-background border-border text-foreground text-xs h-8 pl-8 font-mono focus:border-primary"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-primary" /> Time Range
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-2.5 py-1.5 focus:border-primary outline-none font-mono"
          >
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last 60 minutes</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="custom">Custom Range...</option>
          </select>
        </div>

        {/* Log Type Checkboxes */}
        <Collapsible defaultOpen className="w-full space-y-1 pt-2 border-t border-border/40">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-primary" /> Log Type
            </span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1 font-mono text-[11px]">
            {[
              { key: "api_gateway", label: "API Gateway", count: 71 },
              { key: "postgis_db", label: "PostGIS & DB", count: 15 },
              { key: "spring_boot", label: "Spring Boot Core", count: 8 },
              { key: "keycloak_auth", label: "Keycloak Auth", count: 3 },
              { key: "go_gateways", label: "Go Gateways", count: 42 },
            ].map((type) => (
              <label
                key={type.key}
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/40 cursor-pointer transition-colors group"
              >
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
                <span className="text-[10px] font-mono text-muted-foreground/60">{type.count}</span>
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Status Code / Severity Level Checkboxes */}
        <Collapsible defaultOpen className="w-full space-y-1 pt-2 border-t border-border/40">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-primary" /> Level / Status
            </span>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1 font-mono text-[11px]">
            {[
              { key: "success", label: "Success (2xx)", color: "text-emerald-400" },
              { key: "warning", label: "Warning (4xx)", color: "text-amber-400" },
              { key: "error", label: "Error (5xx)", color: "text-rose-400" },
            ].map((lvl) => (
              <label
                key={lvl.key}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={!!selectedLevels[lvl.key]}
                  onChange={() => toggleLevel(lvl.key)}
                  className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <span className={`font-semibold ${lvl.color}`}>{lvl.label}</span>
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>

      </div>

      {/* Footer Connection Status */}
      <div className="p-3 border-t border-border/40 space-y-1 font-mono text-[10px] shrink-0 bg-sidebar-accent/20">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Stream Status:</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {isLivePaused ? "PAUSED" : "LIVE"}
          </span>
        </div>
        <p className="text-muted-foreground/60 text-[9px]">
          ftth-audit-gateway • Port 5009
        </p>
      </div>
    </div>
  );
}
