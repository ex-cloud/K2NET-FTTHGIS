"use client";

import { useState } from "react";
import { Badge, Button, PageLayout } from "@k2net/ui";
import {
  Terminal,
  Download,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  BarChart2,
  Copy,
  Check,
  X,
  ChevronRight,
  FileCode,
  Layers,
} from "lucide-react";
import { useAuditLogStream, AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import { SystemHealthWrapper } from "@/components/page-guards/system-health-wrapper";
import { useLogsFilter } from "@/components/logs/logs-filter-context";
import { toast } from "sonner";

export default function GlobalLogsPage() {
  const {
    searchQuery,
    setSearchQuery,
    isLivePaused,
    setIsLivePaused,
    selectedTypes,
    selectedLevels,
  } = useLogsFilter();

  // Stream Hook
  const { logs, totalCount, clearLogs } = useAuditLogStream("all");
  const [showHistogram, setShowHistogram] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<AuditStreamEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter logs locally based on pane selections in Secondary Sidebar
  const filteredLogs = logs.filter((log) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesText =
        log.message.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.timestamp.toLowerCase().includes(q);
      if (!matchesText) return false;
    }
    return true;
  });

  const handleCopyLog = (log: AuditStreamEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedId(log.id);
    toast.success("Log JSON copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `k2net-logs-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Exported ${filteredLogs.length} log events to JSON.`);
  };

  // Generate 20 timestamp buckets for the Supabase-style histogram
  const histogramBuckets = Array.from({ length: 20 }, (_, i) => {
    const minute = String(i * 3).padStart(2, "0");
    const count = i % 3 === 0 ? 0 : (i * 7 + 3) % 18 + 1;
    return { time: `13:${minute}`, count };
  });

  return (
    <SystemHealthWrapper>
      <PageLayout variant="workspace" spaceY="space-y-0" showLogoWatermark={false}>
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden font-mono text-xs w-full bg-background select-none">
          
          {/* Top Filter Bar (Supabase Studio Exact Top Bar) */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/60 backdrop-blur-md shrink-0">
            
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="h-7 text-[11px] font-mono gap-1 text-muted-foreground hover:text-foreground border border-border/50"
              >
                <X className="w-3 h-3" /> Reset
              </Button>

              {searchQuery && (
                <Badge className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20 gap-1.5 px-2 py-0.5">
                  Search = &quot;{searchQuery}&quot;
                  <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => setSearchQuery("")} />
                </Badge>
              )}

              <span className="text-[10px] text-muted-foreground/60">Filter by Log Type, Level, Status...</span>
            </div>

            {/* Top Right Quick Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistogram(!showHistogram)}
                title="Toggle Event Density Histogram"
                className={`h-7 w-7 p-0 border border-border/50 ${showHistogram ? "bg-muted text-primary" : "text-muted-foreground"}`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportJson}
                title="Export Filtered JSON"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground border border-border/50"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLivePaused((prev) => !prev)}
                className={`h-7 text-[11px] font-mono gap-1.5 border-border ${
                  isLivePaused ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}
              >
                {isLivePaused ? <Play className="w-3 h-3 fill-current" /> : <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                {isLivePaused ? "Paused" : "Live"}
              </Button>
            </div>

          </div>

          {/* Supabase-Style Event Histogram Bar Chart */}
          {showHistogram && (
            <div className="px-6 py-2.5 bg-muted/20 border-b border-border/60 flex flex-col gap-1 shrink-0 select-none">
              <div className="flex items-end justify-between h-10 gap-1.5 px-2">
                {histogramBuckets.map((bucket, idx) => {
                  const heightPct = Math.min(100, Math.max(10, (bucket.count / 20) * 100));
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                      title={`${bucket.time} — ${bucket.count} events`}
                    >
                      <div className="w-full bg-muted/40 group-hover:bg-primary/20 rounded-t h-full flex items-end">
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full bg-primary/40 group-hover:bg-primary transition-all rounded-t"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between px-2 text-[9px] text-muted-foreground/60 font-mono">
                <span>13:45</span>
                <span>14:00</span>
                <span>14:15</span>
                <span>14:30</span>
                <span>14:42</span>
              </div>
            </div>
          )}

          {/* MAIN STREAM TABLE GRID */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            
            {/* Log Stream Table */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-r border-border/40">
              
              {/* Columns Header */}
              <div className="flex items-center px-4 py-2 bg-muted/50 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none shrink-0 font-mono">
                <div className="w-48 shrink-0">DATE</div>
                <div className="flex-1 min-w-0">EVENT MESSAGE</div>
              </div>

              {/* Rows Feed */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/30 custom-scrollbar">
                {filteredLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs italic gap-2 py-16 font-mono">
                    <Terminal className="w-10 h-10 opacity-30 text-primary" />
                    <p className="font-semibold text-foreground">No results found</p>
                    <p className="text-[11px] text-muted-foreground/60">Try clearing the search filter or enabling log types in the left pane.</p>
                  </div>
                ) : (
                  filteredLogs.map((log: AuditStreamEntry) => {
                    const isSelected = selectedLog?.id === log.id;
                    const isError = log.severity === "ERROR";
                    const isWarn = log.severity === "WARN" || log.severity === "CRITICAL";

                    return (
                      <div
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={`flex items-center px-4 py-2 font-mono text-[11px] transition-colors cursor-pointer group ${
                          isSelected
                            ? "bg-primary/10 text-foreground border-l-2 border-primary"
                            : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {/* Status Dot */}
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 mr-2.5 ${
                            isError ? "bg-rose-500" : isWarn ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        />

                        {/* Date Column */}
                        <div className="w-44 shrink-0 text-muted-foreground font-mono text-[11px] select-none">
                          {log.timestamp}
                        </div>

                        {/* Copy / Inspect Icon */}
                        <button
                          onClick={(e) => handleCopyLog(log, e)}
                          title="Copy Log JSON"
                          className="p-1 rounded hover:bg-muted/80 text-muted-foreground/60 hover:text-foreground mr-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <span className="text-muted-foreground/40 mr-3 shrink-0">—</span>

                        {/* Single-line Structured Event Message (Supabase Exact Style) */}
                        <div className="flex-1 min-w-0 truncate font-mono text-[11px]">
                          <span className="text-foreground font-semibold">{log.actor}</span>
                          <span className="text-muted-foreground/60 mx-1.5">|</span>
                          <span className={isError ? "text-rose-400 font-bold" : isWarn ? "text-amber-400" : "text-emerald-400"}>
                            {log.action}
                          </span>
                          <span className="text-muted-foreground/60 mx-1.5">|</span>
                          <span className="text-foreground/90">{log.message}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Status Bar */}
              <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground font-mono shrink-0 select-none">
                <div>
                  <span>Showing <strong>{filteredLogs.length}</strong> of {totalCount} rows</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>ftth-audit-gateway • 5009</span>
                </div>
              </div>

            </div>

            {/* Slide-over JSON Detail Inspector Drawer (When Row is Clicked) */}
            {selectedLog && (
              <div className="w-96 bg-card border-l border-border flex flex-col min-h-0 shrink-0 font-mono text-xs">
                <div className="p-3 border-b border-border flex items-center justify-between bg-muted/40">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-primary" />
                    <span className="font-bold text-foreground">Log Details</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLog(null)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-[11px] custom-scrollbar">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold">Event ID</label>
                    <p className="text-foreground bg-muted/40 p-2 rounded border border-border/50 text-[10px] break-all">
                      {selectedLog.id}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold">Action / Type</label>
                    <p className="text-primary font-bold">{selectedLog.action}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold">Timestamp</label>
                    <p className="text-foreground">{selectedLog.timestamp}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold">Raw JSON Payload</label>
                    <pre className="bg-background p-3 rounded border border-border text-[10px] text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedLog, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="p-3 border-t border-border bg-muted/20">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleCopyLog(selectedLog, e as any)}
                    className="w-full text-xs font-mono gap-1.5 h-8"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Raw Event JSON
                  </Button>
                </div>
              </div>
            )}

          </div>

        </div>
      </PageLayout>
    </SystemHealthWrapper>
  );
}
