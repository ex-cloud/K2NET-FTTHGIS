"use client";

import { useState } from "react";
import { Badge, Button, Input, PageLayout } from "@k2net/ui";
import {
  Terminal,
  RefreshCw,
  Search,
  Filter,
  Download,
  Play,
  Pause,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  KeyRound,
  Cpu,
  Layers,
  Building2,
  Trash2,
} from "lucide-react";
import { useAuditLogStream, AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import { SystemHealthWrapper } from "@/components/page-guards/system-health-wrapper";
import { toast } from "sonner";

export default function GlobalLogsPage() {
  // Left Filter Pane States
  const [timeRange, setTimeRange] = useState<string>("1h");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLivePaused, setIsLivePaused] = useState<boolean>(false);
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({
    api_gateway: true,
    postgis_db: true,
    spring_boot: true,
    keycloak_auth: true,
    go_gateways: true,
  });
  const [selectedLevels, setSelectedLevels] = useState<Record<string, boolean>>({
    success: true,
    warning: true,
    error: true,
  });

  // Stream Hook
  const { logs, totalCount, status, clearLogs } = useAuditLogStream("all");

  const toggleType = (key: string) => {
    setSelectedTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleLevel = (key: string) => {
    setSelectedLevels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter logs locally based on pane selections
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

  return (
    <SystemHealthWrapper>
      <PageLayout variant="workspace" spaceY="space-y-6">
        
        {/* Workspace Standard Header */}
        <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Monitoring
              </Badge>
              <span className="text-xs text-muted-foreground">• Forensics & Real-time Log Stream</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Terminal className="w-6 h-6 text-primary" /> Global Logs Explorer
            </h1>
            <p className="text-xs text-muted-foreground">
              Centralized real-time event streaming and forensics across all platform microservices.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLivePaused(!isLivePaused)}
              className={`h-9 text-xs font-mono gap-1.5 border-border ${
                isLivePaused ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-card text-foreground"
              }`}
            >
              {isLivePaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
              {isLivePaused ? "Resume Stream" : "Pause Live Feed"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              className="h-9 text-xs font-mono gap-1.5 border-border hover:bg-muted text-foreground"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearLogs}
              className="h-9 text-xs font-mono gap-1 text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </Button>
          </div>
        </div>

        {/* Workspace Unified Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-12">
          
          {/* LEFT FILTER CONTROLS PANE (1/4 column) */}
          <div className="bg-card/60 backdrop-blur-md p-4 rounded-xl border border-border flex flex-col gap-5 shrink-0 font-sans text-xs shadow-xs h-fit">
            
            {/* Search Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Search className="w-3 h-3 text-primary" /> Full-Text Filter
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by OLT, IP, actor..."
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
            <div className="space-y-2 border-t border-border/50 pt-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-primary" /> Log Type
              </label>
              <div className="space-y-1.5 font-mono text-[11px]">
                {[
                  { key: "api_gateway", label: "API Gateway", count: 71 },
                  { key: "postgis_db", label: "PostGIS & DB", count: 15 },
                  { key: "spring_boot", label: "Spring Boot Core", count: 8 },
                  { key: "keycloak_auth", label: "Keycloak Auth", count: 3 },
                  { key: "go_gateways", label: "Go Gateways", count: 42 },
                ].map((type) => (
                  <label
                    key={type.key}
                    className="flex items-center justify-between p-1.5 rounded hover:bg-muted/40 cursor-pointer transition-colors group"
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
              </div>
            </div>

            {/* Status Code / Severity Level Checkboxes */}
            <div className="space-y-2 border-t border-border/50 pt-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-primary" /> Level / Status
              </label>
              <div className="space-y-1.5 font-mono text-[11px]">
                {[
                  { key: "success", label: "Success (2xx)", color: "text-emerald-400" },
                  { key: "warning", label: "Warning (4xx)", color: "text-amber-400" },
                  { key: "error", label: "Error (5xx)", color: "text-rose-400" },
                ].map((lvl) => (
                  <label
                    key={lvl.key}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/40 cursor-pointer transition-colors"
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
              </div>
            </div>

            {/* Footer Connection Status */}
            <div className="pt-3 border-t border-border/50 space-y-1 font-mono text-[10px]">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>SSE Stream Status:</span>
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

          {/* MAIN TERMINAL LOG STREAM CANVAS (3/4 column) */}
          <div className="lg:col-span-3 bg-card/60 backdrop-blur-md rounded-xl border border-border flex flex-col font-mono text-xs overflow-hidden shadow-xs h-[600px]">
            
            {/* Table Header Bar */}
            <div className="flex items-center px-4 py-2.5 bg-muted/40 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none shrink-0">
              <div className="w-36 shrink-0">Timestamp</div>
              <div className="w-20 shrink-0">Level</div>
              <div className="w-40 shrink-0">Event / Action</div>
              <div className="flex-1 min-w-0">Log Message</div>
              <div className="w-32 shrink-0 text-right">Actor / Source</div>
            </div>

            {/* Terminal Feed Scroll Container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs italic gap-2 py-12">
                  <Terminal className="w-8 h-8 opacity-40 text-primary" />
                  <p>No log events match your current filter settings.</p>
                  <p className="text-[10px] text-muted-foreground/60">Try clearing the search query or enabling log type checkboxes.</p>
                </div>
              ) : (
                filteredLogs.map((log: AuditStreamEntry) => {
                  const isWarn = log.severity === "WARN" || log.severity === "CRITICAL";
                  const isError = log.severity === "ERROR";
                  
                  return (
                    <div
                      key={log.id}
                      className="flex items-center px-3 py-1.5 rounded hover:bg-muted/30 border border-transparent hover:border-border/60 transition-colors text-[11px] group"
                    >
                      {/* Timestamp */}
                      <div className="w-36 shrink-0 text-muted-foreground/70 font-mono text-[10px] select-none">
                        {log.timestamp}
                      </div>

                      {/* Level Badge */}
                      <div className="w-20 shrink-0">
                        <Badge
                          className={`text-[9px] px-1.5 py-0 font-mono uppercase ${
                            isError
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : isWarn
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          }`}
                        >
                          {log.severity}
                        </Badge>
                      </div>

                      {/* Action */}
                      <div className="w-40 shrink-0 font-semibold text-foreground truncate pr-2">
                        [{log.action}]
                      </div>

                      {/* Message */}
                      <div className="flex-1 min-w-0 truncate text-muted-foreground group-hover:text-foreground transition-colors">
                        {log.message}
                      </div>

                      {/* Actor */}
                      <div className="w-32 shrink-0 text-right text-[10px] text-muted-foreground/60 font-mono truncate">
                        {log.actor}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Status Bar */}
            <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground select-none shrink-0">
              <div className="flex items-center gap-3">
                <span>Showing <strong className="text-foreground font-mono">{filteredLogs.length}</strong> of {totalCount} events</span>
                <span>•</span>
                <span>Filter: <strong className="text-primary font-mono">{searchQuery || "All"}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Kong API Gateway Decorator Active</span>
              </div>
            </div>

          </div>

        </div>

      </PageLayout>
    </SystemHealthWrapper>
  );
}
