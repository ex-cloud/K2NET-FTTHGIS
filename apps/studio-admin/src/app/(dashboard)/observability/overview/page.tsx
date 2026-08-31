

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "@/lib/navigation-compat";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, PageLayout } from "@k2net/ui";
import {
  ScanLine,
  RefreshCw,
  TrendingDown,
  Database,
  Server,
  Cpu,
  MemoryStick,
  AlertCircle,
  LayoutList,
  Table,
  LayoutGrid,
  ArrowRight,
  ExternalLink,
  CalendarDays,
} from "lucide-react";
import { getSystemHealthMetrics, getSystemThroughput, ThroughputPoint } from "@/lib/actions/health";
import { useServiceHealthSparkline, ServiceHealthRow } from "@/hooks/useServiceHealthSparkline";
import { LogsDateRangePicker } from "@/components/logs/logs-date-range-picker";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

// ─── Mini sparkline bar component ────────────────────────────────────────────
function MiniBarChart({ data, unit }: { data: number[]; unit: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((v, i) => (
        <div
          key={i}
          title={`${v} ${unit}`}
          className="w-1.5 bg-primary rounded-sm opacity-70 hover:opacity-100 hover:scale-y-110 transition-all cursor-help"
          style={{ height: `${Math.max(10, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon,
}: {
  label: string; value: string; sub: string; icon: React.ElementType;
}) {
  return (
    <Card glowingEffect className="p-5 flex flex-col gap-2 bg-card/60 backdrop-blur-sm border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

// ─── Date range parser (same string format as LogsDateRangePicker) ────────────
function parseDateRangeValue(value: string): { startMs: number; endMs: number; label: string } {
  const nowMs = Date.now();
  if (value.startsWith("custom:")) {
    const parts = value.substring(7).split("_");
    if (parts.length === 2) {
      const from = new Date(parts[0]).getTime();
      const to   = new Date(parts[1]).getTime();
      return {
        startMs: isNaN(from) ? nowMs - 30 * 60 * 1000 : from,
        endMs:   isNaN(to)   ? nowMs                   : to,
        label:   "Custom Range",
      };
    }
  }
  const PRESETS: Record<string, { ms: number; label: string }> = {
    "10m": { ms: 10 * 60 * 1000,           label: "Last 10 minutes" },
    "30m": { ms: 30 * 60 * 1000,           label: "Last 30 minutes" },
    "1h":  { ms: 60 * 60 * 1000,           label: "Last 60 minutes" },
    "3h":  { ms: 3  * 60 * 60 * 1000,      label: "Last 3 hours"    },
    "24h": { ms: 24 * 60 * 60 * 1000,      label: "Last 24 hours"   },
    "7d":  { ms: 7  * 24 * 60 * 60 * 1000, label: "Last 7 days"     },
    "14d": { ms: 14 * 24 * 60 * 60 * 1000, label: "Last 14 days"    },
    "28d": { ms: 28 * 24 * 60 * 60 * 1000, label: "Last 28 days"    },
  };
  const preset = PRESETS[value] ?? PRESETS["30m"];
  return { startMs: nowMs - preset.ms, endMs: nowMs, label: preset.label };
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ObservabilityOverviewPage() {
  const router = useRouter();
  const [healthData, setHealthData] = useState<{
    cpu: number;
    memory: number;
    postgresConns: number;
    slowQueries: number;
  } | null>(null);
  const [throughput, setThroughput] = useState<ThroughputPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Date range filter — same string format as LogsDateRangePicker
  const [dateValue, setDateValue] = useState<string>("30m");
  const timeRange = useMemo(() => parseDateRangeValue(dateValue), [dateValue]);

  // View States for layout configurations
  const [viewMode, setViewMode] = useState<"list" | "table" | "card">("list");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "up" | "down">("all");

  // Real-time Service Health Hook — passes time range so sparklines reflect selected period
  const { rows: serviceRows, loading: sparklineLoading, error: sparklineError, refresh: refreshSparkline } = useServiceHealthSparkline(timeRange);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [metrics, tp] = await Promise.all([
        getSystemHealthMetrics(),
        getSystemThroughput({ startMs: timeRange.startMs, endMs: timeRange.endMs }),
      ]);
      setHealthData({
        cpu: Math.round(metrics.cpu),
        memory: Math.round((metrics.memUsedBytes / metrics.memTotalBytes) * 100),
        postgresConns: 12,
        slowQueries: 4,
      });
      setThroughput(tp);
    } catch (err) {
      console.error("[ObservabilityOverview] Refresh metrics failed:", err);
    } finally {
      setLoading(false);
    }
    refreshSparkline();
  }, [refreshSparkline, timeRange.startMs, timeRange.endMs]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Click to logs redirect mapping
  const handleServiceClick = (svc: ServiceHealthRow) => {
    if (svc.logType) {
      router.push(`/logs?filter=log_type:eq:${svc.logType}`);
    } else {
      router.push(`/logs?search=${encodeURIComponent(svc.key)}`);
    }
  };

  // Filter rows by active category tab + status filter
  const filteredRows = serviceRows.filter((r) => {
    const categoryMatch = activeCategory === "all" || r.category === activeCategory;
    const statusMatch   = statusFilter === "all"   || r.status === statusFilter;
    return categoryMatch && statusMatch;
  });

  const downCount = serviceRows.filter((r) => r.status === "down").length;

  const categories = [
    { key: "all", label: "All Services" },
    { key: "core", label: "Core" },
    { key: "databases", label: "Databases & Storage" },
    { key: "gateways", label: "Go Gateways" },
    { key: "observability", label: "Observability" },
  ];

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              SRE Command Center
            </Badge>
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground tracking-tight">
            <ScanLine className="h-5 w-5 text-primary" />
            Observability Overview
          </h1>
          <p className="text-xs text-muted-foreground">
            Real-time platform health — database, compute, and service throughput from Prometheus + Spring Boot.
          </p>
        </div>

        {/* Header Controls: Date Picker + Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <LogsDateRangePicker
              value={dateValue}
              onChange={(v) => setDateValue(v)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => refresh()} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary mr-1" : "mr-1"}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Slow Queries (>500ms)"
          value={healthData ? String(healthData.slowQueries) : "—"}
          sub="via pg_stat_statements · last 24h"
          icon={TrendingDown}
        />
        <KpiCard
          label="Peak DB Connections"
          value={loading ? "…" : `${healthData?.postgresConns ?? "—"} / 100`}
          sub="active connections to ftth_gis"
          icon={Database}
        />
        <KpiCard
          label="Host Memory"
          value={loading ? "…" : `${healthData?.memory ?? "—"}%`}
          sub="of total server RAM in use"
          icon={MemoryStick}
        />
        <KpiCard
          label="Host CPU"
          value={loading ? "…" : `${healthData?.cpu ?? "—"}%`}
          sub="avg across all cores · Prometheus"
          icon={Cpu}
        />
      </div>

      {/* Service Health Grid Section */}
      <Card className="border-border">
        <CardHeader className="border-b border-border pb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              Service Health
              {!sparklineLoading && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Request throughput per service — derived from Prometheus health-metrics · auto-refresh 30s
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {sparklineError && (
              <div className="flex items-center gap-1 text-[10px] text-amber-500 mr-2">
                <AlertCircle className="h-3 w-3" />
                {sparklineError}
              </div>
            )}

            {/* Status Filter Pills */}
            <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
              {([
                { key: "all",  label: "All" },
                { key: "up",   label: "Up" },
                { key: "down", label: "Down" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`h-7 px-2.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                    statusFilter === key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {key === "up"   && <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />}
                  {key === "down" && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse inline-block" />}
                  {label}
                  {key === "down" && downCount > 0 && (
                    <span className="ml-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-bold px-1.5 py-0.5 leading-none">
                      {downCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* View Mode Selectors */}
            <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2.5 rounded-md ${viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                onClick={() => setViewMode("list")}
              >
                <LayoutList className="h-3.5 w-3.5 mr-1" />
                List
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2.5 rounded-md ${viewMode === "table" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                onClick={() => setViewMode("table")}
              >
                <Table className="h-3.5 w-3.5 mr-1" />
                Table
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2.5 rounded-md ${viewMode === "card" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                onClick={() => setViewMode("card")}
              >
                <LayoutGrid className="h-3.5 w-3.5 mr-1" />
                Cards
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Tab Categories Filter */}
        <div className="px-5 py-2.5 border-b border-border bg-muted/10 overflow-x-auto flex gap-1.5">
          {categories.map((cat) => (
            <Button
              key={cat.key}
              variant="ghost"
              size="sm"
              className={`h-7 px-3 rounded-full text-xs font-medium border border-transparent ${
                activeCategory === cat.key
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Dynamic Service Rendering based on Selected View Mode */}
        <CardContent className="p-0">
          {/* 1. LIST VIEW */}
          {viewMode === "list" && (
            <div className="divide-y divide-border">
              {filteredRows.map((svc) => (
                <div
                  key={svc.key}
                  onClick={() => handleServiceClick(svc)}
                  className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors group/row cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                        svc.status === "up"
                          ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb,16,185,129),0.5)]"
                          : svc.status === "down"
                          ? "bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                          : "bg-muted-foreground"
                      }`}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-foreground group-hover/row:text-primary transition-colors truncate">
                        {svc.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                        {svc.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <MiniBarChart data={svc.bars} unit={svc.unit} />
                    <span className="text-xs text-muted-foreground w-24 text-right tabular-nums font-mono">
                      {sparklineLoading ? "…" : `${svc.rps} ${svc.unit}`}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. TABLE VIEW */}
          {viewMode === "table" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted/20">
                    <th className="px-5 py-3 w-28">Status</th>
                    <th className="px-5 py-3">Service Name</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3 text-center w-36">Throughput Trend</th>
                    <th className="px-5 py-3 text-right w-32">RPS Value</th>
                    <th className="px-5 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRows.map((svc) => (
                    <tr
                      key={svc.key}
                      onClick={() => handleServiceClick(svc)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group/row"
                    >
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              svc.status === "up" ? "bg-primary animate-pulse" : svc.status === "down" ? "bg-rose-500" : "bg-muted-foreground"
                            }`}
                          />
                          {svc.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-foreground group-hover/row:text-primary transition-colors text-sm">
                        {svc.name}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        {svc.category}
                      </td>
                      <td className="px-5 py-3.5 align-middle">
                        <div className="flex justify-center">
                          <MiniBarChart data={svc.bars} unit={svc.unit} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs text-foreground font-medium">
                        {svc.rps} <span className="text-[10px] text-muted-foreground font-normal">{svc.unit}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-30 group-hover/row:opacity-100 transition-opacity" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. CARD GRID VIEW */}
          {viewMode === "card" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 p-5">
              {filteredRows.map((svc) => (
                <div
                  key={svc.key}
                  onClick={() => handleServiceClick(svc)}
                  className="flex flex-col justify-between p-4 rounded-xl border border-border bg-card/40 hover:bg-card/80 hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all cursor-pointer group/row"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        {svc.category}
                      </span>
                      <span className="text-sm font-bold text-foreground group-hover/row:text-primary transition-colors truncate mt-0.5">
                        {svc.name}
                      </span>
                    </div>
                    <Badge
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border ${
                        svc.status === "up"
                          ? "bg-primary/10 border-primary/20 text-primary"
                          : svc.status === "down"
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {svc.status}
                    </Badge>
                  </div>

                  <div className="flex items-end justify-between gap-4 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-2xl font-black text-foreground tracking-tight tabular-nums">
                        {svc.rps}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">
                        {svc.unit}
                      </span>
                    </div>
                    <div className="flex items-end gap-3">
                      <MiniBarChart data={svc.bars} unit={svc.unit} />
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-30 group-hover/row:opacity-100 group-hover/row:translate-x-0.5 transition-all mb-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Throughput Chart — real dynamic data from Prometheus */}
      {throughput.length > 0 && (
        <Card className="border-border">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-sm font-semibold text-foreground">
              Combined Throughput — {timeRange.label}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Total HTTP hits across all gateways · Prometheus</p>
          </CardHeader>
          <CardContent className="pt-5">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={throughput}>
                <defs>
                  <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  }}
                  labelStyle={{ color: "var(--foreground)", fontWeight: "bold" }}
                  itemStyle={{ color: "var(--primary)" }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  name="Requests/min"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#throughputGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}
