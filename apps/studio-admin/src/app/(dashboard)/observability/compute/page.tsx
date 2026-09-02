

import React, { useState, useCallback, useEffect } from "react";
import { useComputeObservability } from "@/hooks/useComputeObservability";
import {
  Activity, Cpu, HardDrive, MemoryStick, RefreshCw,
  Database, Archive, GitBranch, Server, Gauge, CheckCircle2,
  XCircle, Circle,
} from "lucide-react";
import { SystemHealthWrapper } from "@/components/page-guards/system-health-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button, PageLayout, ActionTooltip } from "@k2net/ui";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";

// ─── getSystemHealthMetrics: masih dipakai untuk KPI CPU/RAM/Disk ─────────────
import {
  getSystemHealthMetrics,
  SystemHealthData,
} from "@/lib/actions/health";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── MetricCard ───────────────────────────────────────────────────────────────
function MetricCard({
  icon: Icon, label, value, sub, percent, color,
}: {
  icon: React.ElementType; label: string; value: string; sub: string; percent: number; color: string;
}) {
  const colorMap: Record<string, { bar: string; icon: string }> = {
    emerald: { bar: "bg-primary", icon: "text-primary" },
    sky: { bar: "bg-sky-500", icon: "text-sky-500 dark:text-sky-400" },
    violet: { bar: "bg-violet-500", icon: "text-violet-500 dark:text-violet-400" },
    amber: { bar: "bg-amber-500", icon: "text-amber-500 dark:text-amber-400" },
  };
  const c = colorMap[color] ?? colorMap["emerald"];
  const barColor = percent > 90 ? "bg-rose-500" : percent > 75 ? "bg-amber-500" : c.bar;

  return (
    <Card glowingEffect className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase">{label}</span>
        <Icon className={`h-4 w-4 ${c.icon}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Utilization</span>
          <span>{percent}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${Math.min(percent, 100)}%` }} />
        </div>
      </div>
    </Card>
  );
}

// ─── LoadAvgCard (pengganti Database & Cache yang duplikat) ───────────────────
function LoadAvgCard({ load1, load5, load15, cores }: { load1: number; load5: number; load15: number; cores?: number }) {
  const threshold = cores ?? 4;
  const highLoad = load1 > threshold;
  const warnLoad = load1 > threshold * 0.75;
  const barColor = highLoad ? "bg-rose-500" : warnLoad ? "bg-amber-500" : "bg-primary";
  const pctLoad = Math.min(Math.round((load1 / Math.max(threshold, 1)) * 100), 100);

  return (
    <Card glowingEffect className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase">System Load</span>
        <Gauge className={`h-4 w-4 ${highLoad ? "text-rose-500" : "text-primary"}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">
          {load1.toFixed(2)}
          <span className="text-sm font-normal text-muted-foreground ml-1">load1</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          load5: {load5.toFixed(2)} · load15: {load15.toFixed(2)}
        </p>
      </div>
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>vs {threshold} cores</span>
          <span>{pctLoad}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${pctLoad}%` }} />
        </div>
      </div>
    </Card>
  );
}

// ─── ServiceCard with RSS memory ──────────────────────────────────────────────
const SERVICE_PORT_MAP: Record<string, number> = {
  "spring-boot": 9090, "node-exporter": 9100, "notification-gateway": 5001,
  "payment-gateway": 5002, "map-gateway": 5003, "storage-gateway": 5004,
  "audit-gateway": 5006, "export-gateway": 5008, "scheduler-gateway": 5007,
  "olt-gateway": 5005, "whatsapp-gateway": 5009, "go-poller": 5010,
};

const JOB_EMOJI: Record<string, string> = {
  "spring-boot": "🟢", "node-exporter": "📊", "notification-gateway": "📧",
  "payment-gateway": "💳", "map-gateway": "🗺️", "storage-gateway": "🗂️",
  "audit-gateway": "📋", "export-gateway": "📤", "scheduler-gateway": "⏰",
  "olt-gateway": "📡", "whatsapp-gateway": "💬", "go-poller": "🔄",
};

const JOB_LABEL: Record<string, string> = {
  "spring-boot": "Backend API", "node-exporter": "Node Exporter",
  "notification-gateway": "Notification", "payment-gateway": "Payment",
  "map-gateway": "Map", "storage-gateway": "Storage", "audit-gateway": "Audit",
  "export-gateway": "Export", "scheduler-gateway": "Scheduler",
  "olt-gateway": "OLT", "whatsapp-gateway": "WhatsApp", "go-poller": "Poller",
};

function ServiceCard({ job, up, memoryBytes }: { job: string; up: boolean; memoryBytes: number }) {
  const emoji = JOB_EMOJI[job] ?? "⚙️";
  const name = JOB_LABEL[job] ?? job;
  const port = SERVICE_PORT_MAP[job];
  const memMb = memoryBytes > 0 ? `${(memoryBytes / (1024 * 1024)).toFixed(1)} MB` : null;

  return (
    <Card glowingEffect className="relative flex flex-row items-center gap-3 px-4 py-3">
      <span className={`absolute top-3 right-3 h-2 w-2 rounded-full ${up ? "bg-primary shadow-[0_0_6px_var(--primary)] animate-pulse" : "bg-rose-500"}`} />
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50 border border-border/30 text-base select-none">
        {emoji}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold text-foreground leading-tight truncate">{name}</span>
        <span className={`text-[11px] font-bold ${up ? "text-primary" : "text-rose-500"}`}>{up ? "ONLINE" : "OFFLINE"}</span>
        <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
          {port ? `Port: ${port}` : ""}
          {memMb ? <span className="ml-2 opacity-70">{memMb}</span> : null}
        </span>
      </div>
    </Card>
  );
}

// ─── IntegrityCard ────────────────────────────────────────────────────────────
function IntegrityCard({ icon: Icon, label, value, sub, status }: {
  icon: React.ElementType; label: string; value: string; sub: string;
  status: "ok" | "warn" | "unknown";
}) {
  const statusColor = status === "ok" ? "text-primary" : status === "warn" ? "text-amber-500" : "text-muted-foreground";
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${statusColor}`} />
        <span className="text-xs font-semibold text-foreground/75 dark:text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-base font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

// ─── BucketCard ───────────────────────────────────────────────────────────────
function BucketCard({
  name, type, totalSize, totalFiles, schedule, status, script, colorClass,
}: {
  name: string; type: string; totalSize: number; totalFiles: number;
  schedule: string; status: string; script: string; colorClass: string;
}) {
  const statusOk = status === "SUCCESS" || status === "SYNCED_OK" || status === "SYNCED OK";
  return (
    <div className="p-4 rounded-xl border border-border bg-card/80 flex flex-col justify-between space-y-3 shadow-xs">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-foreground">{name}</span>
          <Badge className={`text-[9px] font-mono uppercase ${colorClass}`}>
            {statusOk ? "Synced OK" : status}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">{type}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/20 p-2.5 rounded-lg border border-border/50">
        <div>
          <span className="text-[10px] text-muted-foreground block">Capacity Used</span>
          <span className="font-mono font-bold text-foreground">{formatBytes(totalSize)}</span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block">Total Objects</span>
          <span className="font-mono font-bold text-foreground">{totalFiles} files</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
        <span className="font-mono">{script}</span>
        <span>{schedule}</span>
      </div>
    </div>
  );
}

// ─── CHART — shared tooltip style ─────────────────────────────────────────────
const CHART_TOOLTIP_STYLE = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 };

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ComputeHostPage() {
  const {
    charts,
    loadAvg,
    services,
    devOpsStats,
    loading: computeLoading,
    lastUpdated,
    refresh,
  } = useComputeObservability(30_000);

  const [nodeData, setNodeData] = useState<SystemHealthData | null>(null);
  const [nodeLoading, setNodeLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);

  // Fetch KPI node metrics (CPU / RAM / Disk) from server action
  const fetchNode = useCallback(async () => {
    setNodeLoading(true);
    try {
      const m = await getSystemHealthMetrics();
      setNodeData(m);
    } catch {
      // silent
    } finally {
      setNodeLoading(false);
    }
  }, []);

  useEffect(() => { fetchNode(); }, [fetchNode]);
  useEffect(() => {
    const iv = setInterval(fetchNode, 30_000);
    return () => clearInterval(iv);
  }, [fetchNode]);
  useEffect(() => {
    const t = setInterval(() => setCountdown(c => c <= 1 ? 30 : c - 1), 1000);
    return () => clearInterval(t);
  }, []);

  const cpuPct = nodeData ? Math.round(nodeData.cpu) : 0;
  const memPct = nodeData ? pct(nodeData.memUsedBytes, nodeData.memTotalBytes) : 0;
  const diskPct = nodeData ? pct(nodeData.diskUsedBytes, nodeData.diskTotalBytes) : 0;

  const loading = computeLoading || nodeLoading;

  // Extract typed data
  const migration = devOpsStats?.lastMigration;
  const backup = devOpsStats?.lastBackup;
  const compute = devOpsStats?.compute;
  const cores = (compute?.cpuCores ?? 0) > 0 ? compute?.cpuCores : undefined;

  const onlineCount = services.filter(s => s.up).length;
  const offlineCount = services.filter(s => !s.up).length;

  const lastUpdatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  return (
    <SystemHealthWrapper>
      <PageLayout variant="workspace" spaceY="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Compute & Host
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time server metrics, microservice status, and runtime integrity.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Auto-refresh dalam {countdown}s · Update: {lastUpdatedStr}
            </span>
            <ActionTooltip label="Segarkan Host Metrics" shortcut="R">
              <Button variant="outline" size="sm" onClick={() => { refresh(); fetchNode(); }} disabled={loading}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
                Refresh
              </Button>
            </ActionTooltip>
          </div>
        </div>

        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard icon={Cpu} label="CPU Usage" value={`${cpuPct}%`}
            sub="avg across all cores" percent={cpuPct} color="emerald" />
          <MetricCard icon={MemoryStick} label="RAM Usage"
            value={formatBytes(nodeData?.memUsedBytes ?? 0)}
            sub={`Total: ${formatBytes(nodeData?.memTotalBytes ?? 0)}`}
            percent={memPct} color="sky" />
          <MetricCard icon={HardDrive} label="Disk Usage"
            value={formatBytes(nodeData?.diskUsedBytes ?? 0)}
            sub={`Total: ${formatBytes(nodeData?.diskTotalBytes ?? 0)}`}
            percent={diskPct} color="violet" />
          <LoadAvgCard
            load1={loadAvg.load1}
            load5={loadAvg.load5}
            load15={loadAvg.load15}
            cores={cores}
          />
        </div>

        {/* 12 Microservice Status + RSS Memory Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Status Layanan
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {onlineCount > 0 && (
                <span className="flex items-center gap-1">
                  <Circle className="h-2 w-2 fill-primary text-primary" />
                  {onlineCount} online
                </span>
              )}
              {offlineCount > 0 && (
                <span className="flex items-center gap-1">
                  <Circle className="h-2 w-2 fill-rose-500 text-rose-500" />
                  {offlineCount} offline
                </span>
              )}
              {onlineCount === 0 && offlineCount === 0 && (
                <span>Menghubungkan...</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {services.map((svc) => (
              <ServiceCard key={svc.job} job={svc.job} up={svc.up} memoryBytes={svc.memoryBytes} />
            ))}
            {services.length === 0 && (
              Array.from({ length: 12 }).map((_, i) => (
                <Card key={i} className="h-[72px] animate-pulse bg-muted/30" />
              ))
            )}
          </div>
        </div>

        {/* Runtime & Persistence Integrity */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            Runtime & Persistence Integrity
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <IntegrityCard
              icon={Server}
              label="JVM Memory Pool"
              value={
                compute.heapUsedMb > 0
                  ? `${compute.heapUsedMb} MB / ${compute.heapMaxMb} MB`
                  : compute.usedMemoryMb > 0
                  ? `${compute.usedMemoryMb} MB / ${compute.maxMemoryMb} MB`
                  : "— MB"
              }
              sub={`Heap: ${compute.heapUsedMb} MB · Non-Heap: ${compute.nonHeapUsedMb} MB · ${compute.javaVersion ?? "Java"}`}
              status={compute.heapUsedMb > 0 || compute.usedMemoryMb > 0 ? "ok" : "unknown"}
            />
            <IntegrityCard
              icon={GitBranch}
              label="DB Migration"
              value={`${migration.version !== "—" ? migration.version : "—"} — ${migration.success ? "SUCCESS" : migration.version !== "—" ? "FAILED" : "UNKNOWN"}`}
              sub={`Applied: ${migration.installedOn} · Flyway managed`}
              status={migration.success ? "ok" : migration.version !== "—" ? "warn" : "unknown"}
            />
            <IntegrityCard
              icon={Archive}
              label="Backup Status"
              value={`pg_dump ${backup.status ?? "UNKNOWN"}`}
              sub={`Last run: ${backup.lastBackupTime} · Next: ${backup.nextBackupTime}`}
              status={backup.status === "SUCCESS" ? "ok" : backup.status === "UNKNOWN" || backup.status === "NOT_CONFIGURED" ? "unknown" : "warn"}
            />
          </div>
        </div>

        {/* 3 Charts: HTTP Rate, CPU, RAM (30 minute rolling) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* HTTP Request Rate */}
          <Card>
            <CardHeader className="border-b border-border pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                HTTP Request Rate
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">req/menit · 30 menit terakhir</p>
            </CardHeader>
            <CardContent className="pt-4 px-2 pb-2">
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={charts.http.length > 0 ? charts.http : [{ time: "00:00", requests: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="requests" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* CPU Utilization */}
          <Card>
            <CardHeader className="border-b border-border pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                CPU Utilization
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">% avg · 30 menit terakhir</p>
            </CardHeader>
            <CardContent className="pt-4 px-2 pb-2">
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={charts.cpu.length > 0 ? charts.cpu : [{ time: "00:00", cpu: 0 }]}>
                  <defs>
                    <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={24} unit="%" />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="cpu" stroke="var(--chart-2)" fill="url(#cpuGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* RAM Usage */}
          <Card>
            <CardHeader className="border-b border-border pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
                RAM Usage
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">MB used · 30 menit terakhir</p>
            </CardHeader>
            <CardContent className="pt-4 px-2 pb-2">
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={charts.memory.length > 0 ? charts.memory : [{ time: "00:00", used: 0, total: 8192 }]}>
                  <defs>
                    <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={28} unit="MB" />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="used" stroke="var(--chart-3)" fill="url(#memGrad)" strokeWidth={2} dot={false} name="Used" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* MinIO S3 Offsite Disaster Recovery Section — Real Data */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                Offsite Disaster Recovery & Storage Integrity
              </h3>
              <p className="text-xs text-muted-foreground">
                Status pengarsipan 3 layer backup lokal, MinIO S3 bucket, dan sinkronisasi Nextcloud WebDAV.
              </p>
            </div>
            <Badge className="border-primary/20 bg-primary/10 text-primary font-mono text-[10px]">
              Target Tailscale: 100.110.205.109:9005
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BucketCard
              name="db-backups"
              type="PostgreSQL & Keycloak Dumps"
              totalSize={backup.dbBackups?.totalSize ?? 0}
              totalFiles={Number(backup.dbBackups?.totalFiles ?? 0)}
              schedule="Daily 20:00 WIB"
              status={backup.minioStatus ?? "UNKNOWN"}
              script="backup.sh"
              colorClass="border-primary/20 text-primary bg-primary/5"
            />
            <BucketCard
              name="code-backups"
              type="Monorepo Source Code Archives"
              totalSize={backup.codeBackups?.totalSize ?? 0}
              totalFiles={Number(backup.codeBackups?.totalFiles ?? 0)}
              schedule="Daily 19:00 WIB"
              status={backup.minioStatus ?? "UNKNOWN"}
              script="backup-code.sh"
              colorClass="border-sky-500/20 text-sky-600 dark:text-sky-400 bg-sky-500/5"
            />
            <BucketCard
              name="docker-backups"
              type="Grafana, Prometheus & Keycloak Volumes"
              totalSize={backup.dockerBackups?.totalSize ?? 0}
              totalFiles={Number(backup.dockerBackups?.totalFiles ?? 0)}
              schedule="Weekly Sat 20:00 WIB"
              status={backup.minioStatus ?? "UNKNOWN"}
              script="backup-docker-volumes.sh"
              colorClass="border-purple-500/20 text-purple-600 dark:text-purple-400 bg-purple-500/5"
            />
          </div>

          {/* Nextcloud Layer 3 — informational (no fake trigger) */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                {backup.nextcloudStatus === "SUCCESS"
                  ? <CheckCircle2 className="w-4 h-4 text-primary" />
                  : <XCircle className="w-4 h-4 text-muted-foreground" />}
                Layer 3 Cloud Disaster Recovery (Nextcloud WebDAV)
              </div>
              <p className="text-muted-foreground text-[11px]">
                Sinkronisasi otomatis rclone pukul 21:00 WIB ke{" "}
                <span className="font-mono text-foreground">https://cloud.kdua.net/remote.php/dav/files/andiansyah/FTTH-GIS-Backups/</span>
              </p>
              <p className="text-muted-foreground text-[11px]">
                Last sync: <span className="text-foreground font-medium">{backup.nextcloudSyncTime}</span>
                {" · "}Status:{" "}
                <span className={`font-semibold ${backup.nextcloudStatus === "SUCCESS" ? "text-primary" : "text-muted-foreground"}`}>
                  {backup.nextcloudStatus}
                </span>
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 font-mono text-[10px] border-border">
              Jadwal: Daily 21:00 WIB
            </Badge>
          </div>
        </div>

      </PageLayout>
    </SystemHealthWrapper>
  );
}
