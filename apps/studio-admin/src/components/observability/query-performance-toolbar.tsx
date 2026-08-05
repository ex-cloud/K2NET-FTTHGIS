"use client";

import React, { useState, useEffect } from "react";
import { Button, Checkbox, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@k2net/ui";
import { Search, ChevronDown, RefreshCw, RotateCcw } from "lucide-react";
import { SlowQuery } from "@/hooks/useDbPerformance";

interface QueryPerformanceToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  minTotalTime: number | null;
  setMinTotalTime: (time: number | null) => void;
  selectedRoles: string[];
  setSelectedRoles: (roles: string[]) => void;
  loading: boolean;
  loadingMore: boolean;
  isScrolled: boolean;
  refresh: () => void;
  onOpenResetModal: () => void;
  slowQueries: SlowQuery[];
}

const AVAILABLE_ROLES = [
  { id: "postgres", label: "postgres" },
  { id: "authenticator", label: "authenticator" },
  { id: "supabase_admin", label: "supabase_admin" },
  { id: "keycloak", label: "keycloak" },
  { id: "ftth_user", label: "ftth_user" },
];

export function QueryPerformanceToolbar({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  roleFilter,
  setRoleFilter,
  minTotalTime,
  setMinTotalTime,
  selectedRoles,
  setSelectedRoles,
  loading,
  loadingMore,
  isScrolled,
  refresh,
  onOpenResetModal,
  slowQueries,
}: QueryPerformanceToolbarProps) {
  // Total Time Filter state
  const [operator, setOperator] = useState<">" | "<">(">");
  const [timeValue, setTimeValue] = useState<string>(minTotalTime ? String(minTotalTime) : "");
  
  // Roles selection temp state
  const [tempRoles, setTempRoles] = useState<string[]>(selectedRoles);

  useEffect(() => {
    setTempRoles(selectedRoles);
  }, [selectedRoles]);

  // Export handlers
  const handleCopyMarkdown = () => {
    const headers = "| Query | Calls | Total Time | Mean Time | Min Time | Max Time | Rows | Cache Hit Rate | Role |";
    const divider = "|---|---|---|---|---|---|---|---|---|";
    const rows = slowQueries.map(
      (q) =>
        `| \`${q.query.replace(/`/g, "\\`").slice(0, 50)}\` | ${q.calls} | ${(q.totalTimeMs / 1000).toFixed(2)}s | ${q.meanTimeMs.toFixed(1)}ms | ${q.minTimeMs.toFixed(1)}ms | ${q.maxTimeMs.toFixed(1)}ms | ${q.rows} | ${q.cacheHitRate.toFixed(1)}% | ${q.role} |`
    );
    const markdown = [headers, divider, ...rows].join("\n");
    navigator.clipboard.writeText(markdown);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(slowQueries, null, 2));
  };

  const handleCopyCsv = () => {
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
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    navigator.clipboard.writeText(csv);
  };

  const handleDownloadCsv = () => {
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
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `database_query_performance_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Keyboard shortcuts listener for export
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
  }, [slowQueries]);

  const handleApplyTotalTime = () => {
    const val = parseFloat(timeValue);
    if (!isNaN(val) && val > 0) {
      setMinTotalTime(val);
    } else {
      setMinTotalTime(null);
    }
  };

  const handleClearTotalTime = () => {
    setTimeValue("");
    setMinTotalTime(null);
  };

  const handleToggleRole = (roleId: string) => {
    setTempRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const handleSaveRoles = () => {
    setSelectedRoles(tempRoles);
    if (tempRoles.length === 1) {
      setRoleFilter(tempRoles[0]);
    } else {
      setRoleFilter("");
    }
  };

  const handleClearRoles = () => {
    setTempRoles([]);
    setSelectedRoles([]);
    setRoleFilter("");
  };

  return (
    <div className="relative z-30 bg-background/50 backdrop-blur-sm py-3 select-none shrink-0 border-b border-border overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between px-5">
        {/* LEFT GROUP: Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}
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

          {/* Calls Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border bg-card hover:bg-muted/30 text-foreground rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden">
                <span>{sortBy === "calls" ? "Calls: High to Low" : "Calls"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover border border-border shadow-xl rounded-xl p-1 w-48 z-50">
              <DropdownMenuItem
                onClick={() => setSortBy("calls")}
                className="text-xs py-1.5 px-2.5 rounded-lg cursor-pointer hover:bg-muted/50 text-foreground"
              >
                Calls: High to Low
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy("total_time")}
                className="text-xs py-1.5 px-2.5 rounded-lg cursor-pointer hover:bg-muted/50 text-foreground"
              >
                Default (Total Time)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Total Time Filter Dropdown (Supabase style Popover) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border bg-card hover:bg-muted/30 rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden ${
                minTotalTime !== null ? "text-primary border-primary/40 bg-primary/10" : "text-foreground"
              }`}>
                <span>{minTotalTime !== null ? `Total Time ${operator} ${minTotalTime}ms` : "Total Time"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover border border-border shadow-2xl rounded-xl p-4 w-64 z-50">
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Operator
                  </label>
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
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Value
                  </label>
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
                  <Button variant="ghost" size="sm" onClick={handleClearTotalTime} className="h-7 text-xs px-2.5">
                    Clear
                  </Button>
                  <Button size="sm" onClick={handleApplyTotalTime} className="h-7 text-xs px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                    Apply
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Roles Filter Dropdown (Supabase style Checkboxes Popover) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border bg-card hover:bg-muted/30 rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden ${
                selectedRoles.length > 0 ? "text-primary border-primary/40 bg-primary/10" : "text-foreground"
              }`}>
                <span>{selectedRoles.length > 0 ? `Roles (${selectedRoles.length})` : "Roles"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover border border-border shadow-2xl rounded-xl p-4 w-56 z-50">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Select roles
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar-thin pr-1">
                  {AVAILABLE_ROLES.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-2.5 text-xs font-mono text-foreground hover:bg-muted/30 p-1.5 rounded-md cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={tempRoles.includes(role.id)}
                        onCheckedChange={() => handleToggleRole(role.id)}
                      />
                      <span>{role.label}</span>
                    </label>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/60">
                  <Button variant="ghost" size="sm" onClick={handleClearRoles} className="h-7 text-xs px-2.5">
                    Clear
                  </Button>
                  <Button size="sm" onClick={handleSaveRoles} className="h-7 text-xs px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                    Save
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Source Filter Dropdown */}
          <button
            disabled
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border bg-card text-muted-foreground rounded-lg font-semibold h-8 opacity-70 cursor-not-allowed"
          >
            <span>Source</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* RIGHT GROUP: Reset Report, Refresh & Export Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          {/* Reset Report Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenResetModal}
            className="h-8 w-8 p-0 shrink-0 border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground"
            title="Reset statistics report"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          {/* Refresh Button */}
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

          {/* Export Dropdown Menu (Matching Supabase Screenshots 3 & 4) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border bg-card hover:bg-muted/40 text-foreground rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden">
                <span>Export</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border border-border shadow-2xl rounded-xl p-1.5 min-w-56 z-50">
              <DropdownMenuItem
                onClick={handleCopyMarkdown}
                className="flex items-center justify-between text-xs py-2 px-3 rounded-lg cursor-pointer hover:bg-muted/50 text-foreground"
              >
                <span>Copy as Markdown</span>
                <span className="text-[10px] text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded border border-border">
                  Ctrl M
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleCopyJson}
                className="flex items-center justify-between text-xs py-2 px-3 rounded-lg cursor-pointer hover:bg-muted/50 text-foreground"
              >
                <span>Copy as JSON</span>
                <span className="text-[10px] text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded border border-border">
                  Ctrl J
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleCopyCsv}
                className="flex items-center justify-between text-xs py-2 px-3 rounded-lg cursor-pointer hover:bg-muted/50 text-foreground"
              >
                <span>Copy as CSV</span>
                <span className="text-[10px] text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded border border-border">
                  Ctrl C
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDownloadCsv}
                className="flex items-center justify-between text-xs py-2 px-3 rounded-lg cursor-pointer hover:bg-muted/50 text-foreground"
              >
                <span>Download CSV</span>
                <span className="text-[10px] text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded border border-border">
                  Ctrl D
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Static scroll border: full width, very thin */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-[1px] bg-border/40 transition-opacity duration-300 ${
          isScrolled && !loading && !loadingMore ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Shimmer loading line */}
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
