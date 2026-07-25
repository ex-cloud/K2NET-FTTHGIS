"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getSystemHealthMetrics,
  getSystemThroughput,
  SystemHealthData,
  ThroughputPoint,
} from "@/lib/actions/health";
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  Server,
} from "lucide-react";
import { SystemHealthWrapper } from "@/components/page-guards/system-health-wrapper";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, PageLayout } from "@k2net/ui";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function pct(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((used / total) * 100);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  percent,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  percent: number;
  color: string;
}) {
  const colorMap: Record<string, { ring: string; bar: string; icon: string }> = {
    emerald: {
      ring: "ring-primary/10 dark:ring-primary/20",
      bar: "bg-primary",
      icon: "text-primary",
    },
    sky: {
      ring: "ring-sky-500/10 dark:ring-sky-500/20",
      bar: "bg-sky-500",
      icon: "text-sky-600 dark:text-sky-400",
    },
    violet: {
      ring: "ring-violet-500/10 dark:ring-violet-500/20",
      bar: "bg-violet-500",
      icon: "text-violet-600 dark:text-violet-400",
    },
    amber: {
      ring: "ring-amber-500/10 dark:ring-amber-500/20",
      bar: "bg-amber-500",
      icon: "text-amber-600 dark:text-amber-400",
    },
    rose: {
      ring: "ring-rose-500/10 dark:ring-rose-500/20",
      bar: "bg-rose-500",
      icon: "text-rose-600 dark:text-rose-400",
    },
  };

  const c = colorMap[color] ?? colorMap["emerald"];
  const barColor =
    percent > 90 ? colorMap["rose"].bar : percent > 75 ? colorMap["amber"].bar : c.bar;

  const hexColorMap: Record<string, string> = {
    emerald: "#3ecf8e",
    sky: "#0ea5e9",
    violet: "#8b5cf6",
    amber: "#f59e0b",
    rose: "#f43f5e",
  };
  const beamColor = hexColorMap[color] ?? "#3ecf8e";

  return (
    <Card glowingEffect className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-bold tracking-wider uppercase">
          {label}
        </span>
        <span className={`${c.icon}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground/80 mt-0.5">{sub}</p>
      </div>
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground/80 mb-1">
          <span>Utilization</span>
          <span>{percent}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-700`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

function ServiceCard({ name, job, up }: { name: string; job: string; up: boolean }) {
  const jobIconMap: Record<string, string> = {
    "spring-boot": "🟢",
    "node-exporter": "📊",
    "notification-gateway": "📧",
    "payment-gateway": "💳",
    "map-gateway": "🗺️",
    "storage-gateway": "🗂️",
    "audit-gateway": "📋",
    "export-gateway": "📤",
    "scheduler-gateway": "⏰",
    "olt-gateway": "📡",
    "whatsapp-gateway": "💬",
    "go-poller": "🔄",
  };

  const emoji = jobIconMap[job] ?? "⚙️";

  return (
    <Card 
      glowingEffect
      className="relative flex flex-row items-center gap-3 px-4 py-3"
    >
      {/* Status dot */}
      <span
        className={`absolute top-3 right-3 h-2 w-2 rounded-full ${
          up ? "bg-primary shadow-[0_0_6px_var(--primary)]" : "bg-rose-500"
        } ${up ? "animate-pulse" : ""}`}
      />

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50 border border-border/30 text-base select-none">
        {emoji}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold text-foreground leading-tight truncate">
          {name}
        </span>
        <span className={`text-[11px] font-bold ${up ? "text-primary" : "text-rose-500"}`}>
          {up ? "ONLINE" : "OFFLINE"}
        </span>
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SystemHealthPage() {
  const [data, setData] = useState<SystemHealthData | null>(null);
  const [throughput, setThroughput] = useState<ThroughputPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [countdown, setCountdown] = useState(30);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metrics, tp] = await Promise.all([
        getSystemHealthMetrics(),
        getSystemThroughput(),
      ]);
      setData(metrics);
      setThroughput(tp);
      setLastUpdated(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCountdown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data health");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Countdown ticker
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => (c <= 1 ? 30 : c - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // ─── Computed values ──────────────────────────────────────────────────────
  const cpuPct = data ? Math.round(data.cpu) : 0;
  const memPct = data ? pct(data.memUsedBytes, data.memTotalBytes) : 0;
  const diskPct = data ? pct(data.diskUsedBytes, data.diskTotalBytes) : 0;

  return (
    <SystemHealthWrapper>
      <PageLayout variant="dashboard" spaceY="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            System Health
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitoring real-time server &amp; layanan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 border border-border rounded-lg px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span>Auto-refresh dalam</span>
            <span className="font-mono font-bold text-foreground/80">{countdown}s</span>
          </div>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground/60">Update: {lastUpdated}</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="border-border text-foreground hover:bg-accent hover:text-accent-foreground gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── KPI Cards ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Cpu}
          label="CPU Usage"
          value={loading ? "—" : `${cpuPct}%`}
          sub="avg across all cores"
          percent={cpuPct}
          color={cpuPct > 90 ? "rose" : cpuPct > 75 ? "amber" : "emerald"}
        />
        <MetricCard
          icon={MemoryStick}
          label="RAM Usage"
          value={loading ? "—" : formatBytes(data?.memUsedBytes ?? 0)}
          sub={`Total: ${formatBytes(data?.memTotalBytes ?? 0)}`}
          percent={memPct}
          color="sky"
        />
        <MetricCard
          icon={HardDrive}
          label="Disk Usage"
          value={loading ? "—" : formatBytes(data?.diskUsedBytes ?? 0)}
          sub={`Total: ${formatBytes(data?.diskTotalBytes ?? 0)}`}
          percent={diskPct}
          color="violet"
        />
        {/* Services card */}
        <Card glowingEffect className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-bold tracking-wider uppercase">
              Services
            </span>
            <Server className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {loading ? "—" : `${data?.onlineCount} / ${data?.totalCount}`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">services online</p>
          </div>
          <div className="flex items-center gap-2 mt-auto">
            {data?.onlineCount === data?.totalCount ? (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[11px] gap-1 font-bold">
                <CheckCircle2 className="h-3 w-3" />
                All Systems Operational
              </Badge>
            ) : (
              <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[11px] gap-1 font-bold">
                <XCircle className="h-3 w-3" />
                {(data?.totalCount ?? 0) - (data?.onlineCount ?? 0)} Service Offline
              </Badge>
            )}
          </div>
        </Card>
      </div>

      {/* ── Gateway Status Grid ───────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <Wifi className="h-4 w-4 text-primary" />
            Status Layanan
            <span className="ml-auto text-xs text-muted-foreground/60 font-normal">
              {data?.onlineCount ?? "—"} online · {(data?.totalCount ?? 0) - (data?.onlineCount ?? 0)} offline
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[62px] rounded-xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(data?.gateways ?? []).map((gw) => (
                <ServiceCard key={gw.job} name={gw.name} job={gw.job} up={gw.up} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Throughput Chart ─────────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            HTTP Request Rate — 30 Menit Terakhir
            <span className="ml-auto text-xs text-muted-foreground/60 font-normal">
              req/s (sum all gateways)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {throughput.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground/60 text-sm">
              <WifiOff className="h-4 w-4 mr-2" />
              Data throughput tidak tersedia (metric http_requests_total belum diexpose gateway)
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={throughput}
                margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--popover-foreground)",
                  }}
                  labelStyle={{ color: "var(--muted-foreground)" }}
                  formatter={(val: any) => [`${val} req/s`, "Request Rate"]}
                />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "var(--primary)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      </PageLayout>
    </SystemHealthWrapper>
  );
}
