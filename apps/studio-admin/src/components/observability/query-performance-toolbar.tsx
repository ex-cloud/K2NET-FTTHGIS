import React, { useState, useEffect, useCallback } from "react";
import { Button, Checkbox, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@k2net/ui";
import { Search, ChevronDown, RefreshCw, RotateCcw } from "lucide-react";
import { type SlowQuery } from "@/hooks/useDbPerformance";

interface QueryPerformanceToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  minTotalTime: number | null;
  setMinTotalTime: (time: number | null) => void;
  selectedRoles: string[];
  setSelectedRoles: (roles: string[]) => void;
  sourceFilter: "dashboard" | "nondashboard" | "";
  setSourceFilter: (source: "dashboard" | "nondashboard" | "") => void;
  loading: boolean;
  loadingMore: boolean;
  isScrolled: boolean;
  refresh: () => void;
  onOpenResetModal: () => void;
  slowQueries: SlowQuery[];
}

const ROLE_GROUPS = [
  {
    title: "User Access",
    roles: [
      { id: "super_admin", label: "super_admin" },
      { id: "admin", label: "admin" },
      { id: "noc", label: "noc" },
      { id: "surveyor", label: "surveyor" },
      { id: "system_support", label: "system_support" },
    ],
  },
  {
    title: "System and Services",
    roles: [
      { id: "postgres", label: "postgres" },
      { id: "keycloak", label: "keycloak" },
      { id: "ftth_backend", label: "ftth_backend" },
      { id: "gateways", label: "gateways" },
    ],
  },
  {
    title: "Custom",
    roles: [
      { id: "authenticator", label: "authenticator" },
      { id: "pgbouncer", label: "pgbouncer" },
    ],
  },
];

function TotalTimeDropdown({
  minTotalTime,
  setMinTotalTime,
}: {
  minTotalTime: number | null;
  setMinTotalTime: (t: number | null) => void;
}) {
  const [operator, setOperator] = useState<">" | "<">(">");
  const [timeValue, setTimeValue] = useState<string>(minTotalTime ? String(minTotalTime) : "");

  useEffect(() => {
    setTimeValue(minTotalTime ? String(minTotalTime) : "");
  }, [minTotalTime]);

  const handleApply = () => {
    const val = parseFloat(timeValue);
    if (!isNaN(val) && val > 0) setMinTotalTime(val);
    else setMinTotalTime(null);
  };

  const handleClear = () => {
    setTimeValue("");
    setMinTotalTime(null);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border bg-card hover:bg-muted/30 rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden ${
            minTotalTime !== null ? "text-primary border-primary/40 bg-primary/10" : "text-foreground"
          }`}
        >
          <span>{minTotalTime !== null ? `Total Time ${operator} ${minTotalTime}ms` : "Total Time"}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-popover border border-border shadow-2xl rounded-xl p-4 w-64 z-50">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Operator</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as ">" | "<")}
              className="w-full px-2.5 py-1.5 text-xs border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value=">">Greater than</option>
              <option value="<">Less than</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Value</label>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-border bg-card text-foreground placeholder:text-muted-foreground rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Min: 0 ms</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 text-xs px-2.5">Clear</Button>
            <Button size="sm" onClick={handleApply} className="h-7 text-xs px-3 font-medium">Apply</Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RolesFilterDropdown({
  selectedRoles,
  setSelectedRoles,
}: {
  selectedRoles: string[];
  setSelectedRoles: (roles: string[]) => void;
}) {
  const [tempRoles, setTempRoles] = useState<string[]>(selectedRoles);

  useEffect(() => {
    setTempRoles(selectedRoles);
  }, [selectedRoles]);

  const handleToggle = (id: string) => {
    setTempRoles((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border bg-card hover:bg-muted/30 rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden ${
            selectedRoles.length > 0 ? "text-primary border-primary/40 bg-primary/10" : "text-foreground"
          }`}
        >
          <span>{selectedRoles.length > 0 ? `Roles (${selectedRoles.length})` : "Roles"}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-popover border border-border shadow-2xl rounded-xl p-4 w-64 z-50">
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Select roles</p>
          <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar-thin pr-1">
            {ROLE_GROUPS.map((group) => (
              <div key={group.title} className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider px-1">{group.title}</p>
                <div className="space-y-1">
                  {group.roles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-2.5 text-xs font-mono text-foreground hover:bg-muted/30 p-1.5 rounded-md cursor-pointer transition-colors"
                    >
                      <Checkbox checked={tempRoles.includes(role.id)} onCheckedChange={() => handleToggle(role.id)} />
                      <span>{role.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/60">
            <Button variant="ghost" size="sm" onClick={() => { setTempRoles([]); setSelectedRoles([]); }} className="h-7 text-xs px-2.5">Clear</Button>
            <Button size="sm" onClick={() => setSelectedRoles(tempRoles)} className="h-7 text-xs px-3 font-medium">Save</Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SourceFilterDropdown({
  sourceFilter,
  setSourceFilter,
}: {
  sourceFilter: "dashboard" | "nondashboard" | "";
  setSourceFilter: (s: "dashboard" | "nondashboard" | "") => void;
}) {
  const [tempSource, setTempSource] = useState<"dashboard" | "nondashboard" | "">(sourceFilter);

  useEffect(() => {
    setTempSource(sourceFilter);
  }, [sourceFilter]);

  const handleToggle = (source: "dashboard" | "nondashboard") => {
    setTempSource((prev) => (prev === source ? "" : source));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border bg-card hover:bg-muted/30 rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden ${
            sourceFilter ? "text-primary border-primary/40 bg-primary/10" : "text-foreground"
          }`}
        >
          <span>{sourceFilter ? (sourceFilter === "dashboard" ? "Dashboard & Portal" : "System & Utility") : "Source"}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-popover border border-border shadow-2xl rounded-xl p-4 w-60 z-50">
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Select query source</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 text-xs text-foreground hover:bg-muted/30 p-1.5 rounded-md cursor-pointer transition-colors">
              <Checkbox checked={tempSource === "dashboard"} onCheckedChange={() => handleToggle("dashboard")} />
              <div className="flex flex-col">
                <span className="font-semibold text-xs">Dashboard & Portal Queries</span>
                <span className="text-[10px] text-muted-foreground">K2NET GIS application tables & core features</span>
              </div>
            </label>
            <label className="flex items-center gap-2.5 text-xs text-foreground hover:bg-muted/30 p-1.5 rounded-md cursor-pointer transition-colors">
              <Checkbox checked={tempSource === "nondashboard"} onCheckedChange={() => handleToggle("nondashboard")} />
              <div className="flex flex-col">
                <span className="font-semibold text-xs">System Utility & Background</span>
                <span className="text-[10px] text-muted-foreground">pg_stat, keycloak internals, and system tables</span>
              </div>
            </label>
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60">
            <Button variant="ghost" size="sm" onClick={() => { setTempSource(""); setSourceFilter(""); }} className="h-7 text-xs px-2.5">Clear</Button>
            <Button size="sm" onClick={() => setSourceFilter(tempSource)} className="h-7 text-xs px-3 font-medium">Apply</Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ExportMenuDropdown({
  slowQueries,
}: {
  slowQueries: SlowQuery[];
}) {
  const handleCopyMarkdown = useCallback(() => {
    const headers = "| Query | Calls | Total Time | Mean Time | Min Time | Max Time | Rows | Cache Hit Rate | Role |";
    const divider = "|---|---|---|---|---|---|---|---|---|";
    const rows = slowQueries.map(
      (q) => `| \`${q.query.replace(/`/g, "\\`").slice(0, 50)}\` | ${q.calls} | ${(q.totalTimeMs / 1000).toFixed(2)}s | ${q.meanTimeMs.toFixed(1)}ms | ${q.minTimeMs.toFixed(1)}ms | ${q.maxTimeMs.toFixed(1)}ms | ${q.rows} | ${q.cacheHitRate.toFixed(1)}% | ${q.role} |`
    );
    navigator.clipboard.writeText([headers, divider, ...rows].join("\n"));
  }, [slowQueries]);

  const handleCopyJson = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(slowQueries, null, 2));
  }, [slowQueries]);

  const handleCopyCsv = useCallback(() => {
    const headers = ["Query", "Calls", "Total Time (ms)", "Mean Time (ms)", "Min Time (ms)", "Max Time (ms)", "Rows", "Cache Hit Rate (%)", "Role"];
    const rows = slowQueries.map((q) => [
      `"${q.query.replace(/"/g, '""')}"`,
      q.calls,
      q.totalTimeMs,
      q.meanTimeMs,
      q.minTimeMs,
      q.maxTimeMs,
      q.rows,
      q.cacheHitRate,
      q.role,
    ]);
    navigator.clipboard.writeText([headers.join(","), ...rows.map((r) => r.join(","))].join("\n"));
  }, [slowQueries]);

  const handleDownloadCsv = useCallback(() => {
    const headers = ["Query", "Calls", "Total Time (ms)", "Mean Time (ms)", "Min Time (ms)", "Max Time (ms)", "Rows", "Cache Hit Rate (%)", "Role"];
    const rows = slowQueries.map((q) => [
      `"${q.query.replace(/"/g, '""')}"`,
      q.calls,
      q.totalTimeMs,
      q.meanTimeMs,
      q.minTimeMs,
      q.maxTimeMs,
      q.rows,
      q.cacheHitRate,
      q.role,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `database_query_performance_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [slowQueries]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") {
        e.preventDefault();
        handleCopyMarkdown();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        handleCopyJson();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c" && e.shiftKey) {
        e.preventDefault();
        handleCopyCsv();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDownloadCsv();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCopyMarkdown, handleCopyJson, handleCopyCsv, handleDownloadCsv]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border bg-card hover:bg-muted/40 text-foreground rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden"
        >
          <span>Export</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover border border-border shadow-2xl rounded-xl p-1.5 min-w-56 z-50">
        <DropdownMenuItem onClick={handleCopyMarkdown} className="flex items-center justify-between text-xs py-2 px-3 rounded-lg cursor-pointer hover:bg-muted/50 text-foreground">
          <span>Copy as Markdown</span>
          <span className="text-[10px] text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded border border-border">Ctrl M</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyJson} className="flex items-center justify-between text-xs py-2 px-3 rounded-lg cursor-pointer hover:bg-muted/50 text-foreground">
          <span>Copy as JSON</span>
          <span className="text-[10px] text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded border border-border">Ctrl J</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyCsv} className="flex items-center justify-between text-xs py-2 px-3 rounded-lg cursor-pointer hover:bg-muted/50 text-foreground">
          <span>Copy as CSV</span>
          <span className="text-[10px] text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded border border-border">Ctrl C</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadCsv} className="flex items-center justify-between text-xs py-2 px-3 rounded-lg cursor-pointer hover:bg-muted/50 text-foreground">
          <span>Download CSV</span>
          <span className="text-[10px] text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded border border-border">Ctrl D</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function QueryPerformanceToolbar({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  minTotalTime,
  setMinTotalTime,
  selectedRoles,
  setSelectedRoles,
  sourceFilter,
  setSourceFilter,
  loading,
  loadingMore,
  isScrolled,
  refresh,
  onOpenResetModal,
  slowQueries,
}: QueryPerformanceToolbarProps) {
  return (
    <div className="relative z-30 bg-background/50 backdrop-blur-sm py-3 select-none shrink-0 border-b border-border overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between px-5">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all h-8"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border bg-card hover:bg-muted/30 text-foreground rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden"
              >
                <span>{sortBy === "calls" ? "Calls: High to Low" : "Calls"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover border border-border shadow-xl rounded-xl p-1 w-48 z-50">
              <DropdownMenuItem onClick={() => setSortBy("calls")} className="text-xs py-1.5 px-2.5 rounded-lg cursor-pointer hover:bg-muted/50 text-foreground">
                Calls: High to Low
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("total_time")} className="text-xs py-1.5 px-2.5 rounded-lg cursor-pointer hover:bg-muted/50 text-foreground">
                Default (Total Time)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <TotalTimeDropdown minTotalTime={minTotalTime} setMinTotalTime={setMinTotalTime} />
          <RolesFilterDropdown selectedRoles={selectedRoles} setSelectedRoles={setSelectedRoles} />
          <SourceFilterDropdown sourceFilter={sourceFilter} setSourceFilter={setSourceFilter} />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenResetModal}
            className="h-8 w-8 p-0 shrink-0 border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground"
            title="Reset statistics report"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="h-8 w-8 p-0 shrink-0 border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground"
            title="Refresh metrics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>

          <ExportMenuDropdown slowQueries={slowQueries} />
        </div>
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 h-[1px] bg-border/40 transition-opacity duration-300 ${
          isScrolled && !loading && !loadingMore ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="absolute bottom-0 left-0 right-0 h-[1px] overflow-hidden">
        <div
          className={`h-full w-1/5 bg-gradient-to-r from-transparent via-primary to-transparent transition-opacity duration-300 will-change-transform ${
            loading || loadingMore ? "animate-shimmer-line opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </div>
  );
}
