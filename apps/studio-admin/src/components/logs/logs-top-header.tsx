"use client";

import * as React from "react";
import { Badge, Button } from "@k2net/ui";

import {
  Search,
  X,
  PanelLeft,
  RefreshCw,
  BarChart2,
  Download,
  Play,
} from "lucide-react";
import { useLogsFilter, LOG_TYPES_LABELS } from "./logs-filter-context";
import { toast } from "sonner";

export function LogsTopHeader({
  filteredLogs,
  clearLogs,
}: {
  filteredLogs: any[];
  clearLogs: () => void;
}) {
  const {
    searchQuery,
    setSearchQuery,
    selectedTypes,
    toggleType,
    selectedLevels,
    toggleLevel,
    isLivePaused,
    setIsLivePaused,
    showHistogram,
    setShowHistogram,
    resetAllFilters,
    setIsSidebarCollapsed,
  } = useLogsFilter();

  // Build dynamic filter pills from active selectedTypes & selectedLevels
  const activeTypePills = React.useMemo(
    () =>
      Object.entries(selectedTypes)
        .filter(([, active]) => active)
        .map(([key]) => ({
          id: key,
          label: `Log Type = ${LOG_TYPES_LABELS[key] ?? key}`,
          kind: "type" as const,
        })),
    [selectedTypes]
  );

  const activeLevelPills = React.useMemo(
    () =>
      Object.entries(selectedLevels)
        .filter(([, active]) => active)
        .map(([key]) => ({
          id: key,
          label: `Level = ${key}`,
          kind: "level" as const,
        })),
    [selectedLevels]
  );

  const allPills = [...activeTypePills, ...activeLevelPills];
  const hasActivePills = allPills.length > 0;

  const handleRemovePill = (pill: { id: string; kind: "type" | "level" }) => {
    if (pill.kind === "type") toggleType(pill.id);
    else toggleLevel(pill.id);
  };

  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `k2net-logs-${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(`Exported ${filteredLogs.length} log events to JSON.`);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/60 backdrop-blur-md shrink-0 h-12 w-full font-mono text-xs select-none">

      {/* LEFT: Sidebar collapse toggle — compact, no separator */}
      <button
        onClick={() => setIsSidebarCollapsed((prev) => !prev)}
        title="Toggle Filter Sidebar"
        className="shrink-0 p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <PanelLeft className="w-4 h-4" />
      </button>

      {/* CENTER: Search Input + Dynamic Filter Tag Pills — fills all remaining space */}
      <div className="flex-1 flex items-center gap-1.5 bg-background border border-border/80 rounded-lg px-3 py-1 text-xs focus-within:border-primary transition-colors overflow-hidden min-w-0">
        <Search className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />

        {/* Render active filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1 overflow-hidden">
          {allPills.map((pill) => (
            <Badge
              key={`${pill.kind}-${pill.id}`}
              className="text-[10px] font-mono bg-muted text-foreground border border-border/60 gap-1 px-2 py-0.5 shrink-0 whitespace-nowrap"
            >
              <span>{pill.label}</span>
              <button
                onClick={() => handleRemovePill(pill)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label={`Remove filter ${pill.label}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </Badge>
          ))}

          {/* Freeform text search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              hasActivePills
                ? "Add more filters..."
                : "Filter by Log Type, Level, Status..."
            }
            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 text-xs font-mono"
          />
        </div>

        {/* Clear search query icon (only when query present) */}
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="shrink-0 text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* RIGHT: Action Buttons */}
      <div className="flex items-center gap-1.5 shrink-0 pl-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clearLogs();
            toast.info("Refreshing real-time log feed...");
          }}
          title="Refresh Log Feed"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground border border-border/60 rounded-md"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistogram((prev) => !prev)}
          title="Toggle Histogram Bar Chart"
          className={`h-7 w-7 p-0 border border-border/60 rounded-md ${
            showHistogram ? "bg-muted text-foreground" : "text-muted-foreground"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleExportJson}
          title="Download Filtered JSON"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground border border-border/60 rounded-md"
        >
          <Download className="w-3.5 h-3.5" />
        </Button>

        {/* Live / Paused toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsLivePaused((prev) => !prev)}
          className={`h-7 text-xs font-mono gap-1.5 border-border/80 rounded-md px-2.5 ${
            isLivePaused
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }`}
        >
          {isLivePaused ? (
            <Play className="w-3 h-3 fill-current" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
          {isLivePaused ? "Paused" : "Live"}
        </Button>
      </div>
    </div>
  );
}
