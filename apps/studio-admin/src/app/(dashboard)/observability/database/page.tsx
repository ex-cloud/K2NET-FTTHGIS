

import { useState, useEffect } from "react";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import {
  Card, CardContent, CardHeader, CardTitle,
  Badge, Button, PageLayout, ActionTooltip
} from "@k2net/ui";
import {
  Database, RefreshCw, CheckCircle2, Archive,
  Key, AlertCircle, Cpu, HardDrive, Wifi,
  Activity, Circle
} from "lucide-react";
import { useSystemOverviewData } from "@/hooks/useSystemOverviewData";
import { useDbObservability } from "@/hooks/useDbObservability";
import { useSession } from "@/lib/auth-compat";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function timeAgo(date: Date | null): string {
  if (!date) return "";
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function statusBadgeClass(status: string) {
  if (status === "SUCCESS") return "border-primary/20 bg-primary/10 text-primary";
  if (status === "FAILED") return "border-rose-500/20 bg-rose-500/10 text-rose-500";
  return "border-border/40 bg-muted/40 text-muted-foreground";
}

// ─── Chart Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active, payload, label, unit = ""
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-foreground/75 dark:text-muted-foreground mb-1.5 font-mono">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-foreground/75 dark:text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value}{unit}</span>
        </div>
      ))}
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, accent = false
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <Card glowingEffect className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

// ─── Chart Section ───────────────────────────────────────────────────────────

function ChartCard({
  title, children, source
}: {
  title: string;
  children: React.ReactNode;
  source?: string;
}) {
  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {source && (
          <span className="text-[10px] font-mono text-foreground/75 dark:text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
            {source}
          </span>
        )}
      </div>
      {children}
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DatabaseCachePage() {
  const { data: session } = useSession();
  const systemData = useSystemOverviewData();
  const {
    charts, dbObservability, source, loading, error,
    lastUpdated, refresh
  } = useDbObservability(30_000);

  const { postgresConns, redisCacheHit } = systemData.systemResources;
  const { postgresStatus, redisStatus, redisKeysCached } = systemData.systemHealth;

  // ── Persistence (devops-stats) — still fetched separately for migration/backup data
  const [persistence, setPersistence] = useState({
    migrationVersion: "—",
    migrationStatus: "UNKNOWN" as "SUCCESS" | "FAILED" | "UNKNOWN",
    migrationApplied: "—",
    backupStatus: "UNKNOWN" as "SUCCESS" | "FAILED" | "UNKNOWN",
    backupLastRun: "—",
    backupNextRun: "Tonight 00:00 UTC",
    minioSyncStatus: "UNKNOWN" as "SUCCESS" | "FAILED" | "UNKNOWN",
    minioSyncTime: "—",
    nextcloudStatus: "UNKNOWN" as "SUCCESS" | "FAILED" | "UNKNOWN",
    nextcloudSyncTime: "—",
  });

  const [loadingPersistence, setLoadingPersistence] = useState(true);
  const [persistenceError, setPersistenceError] = useState(false);

  const fetchPersistence = async () => {
    try {
      setLoadingPersistence(true);
      const res = await fetch("/api/v1/system/devops-stats");
      if (!res.ok) throw new Error("Failed to fetch persistence info");
      const d = await res.json();
      setPersistence({
        migrationVersion: d?.lastMigration?.version ?? "—",
        migrationStatus: d?.lastMigration?.success ? "SUCCESS" : "FAILED",
        migrationApplied: d?.lastMigration?.appliedAt ?? "—",
        backupStatus: d?.lastBackup?.status ?? "UNKNOWN",
        backupLastRun: d?.lastBackup?.lastBackupTime ?? "—",
        backupNextRun: "Tonight 00:00 UTC",
        minioSyncStatus: d?.lastBackup?.minioStatus ?? "UNKNOWN",
        minioSyncTime: d?.lastBackup?.minioSyncTime ?? "—",
        nextcloudStatus: d?.lastBackup?.nextcloudStatus ?? "UNKNOWN",
        nextcloudSyncTime: d?.lastBackup?.nextcloudSyncTime ?? "—",
      });
    } catch { setPersistenceError(true); }
    finally { setLoadingPersistence(false); }
  };

  // Load persistence on session ready
  useEffect(() => {
    if ((session as any)?.accessToken) fetchPersistence();
  }, [(session as any)?.accessToken]);

  const handleRefresh = () => {
    systemData.loadData(true);
    refresh();
    fetchPersistence();
  };

  // ── Derived DB sizes
  const { dbSizes, diskInfo, pgCacheHitRate, pgConnectionsByState, largeObjects } = dbObservability;
  const totalDbMb = (dbSizes.totalBytes / (1024 * 1024)).toFixed(1);
  const diskUsedPct = diskInfo.totalBytes > 0
    ? Math.round((diskInfo.usedBytes / diskInfo.totalBytes) * 100)
    : 0;

  // ── Persistence rows (with real nextcloud status)
  const persistenceRows = [
    {
      item: "Last Migration",
      detail: `${persistence.migrationVersion} — ${persistence.migrationStatus === "UNKNOWN" ? "Fetching…" : persistence.migrationApplied}`,
      note: "Flyway managed · auto-versioned",
      status: persistence.migrationStatus,
    },
    {
      item: "Backup Schedule",
      detail: `pg_dump NIGHTLY · Last: ${persistence.backupLastRun}`,
      note: `Next: ${persistence.backupNextRun}`,
      status: persistence.backupStatus,
    },
    {
      item: "MinIO S3 Sync",
      detail: `Last sync: ${persistence.minioSyncTime}`,
      note: "db-backups bucket · Tailscale 100.110.205.109",
      status: persistence.minioSyncStatus,
    },
    {
      item: "Nextcloud Offsite",
      detail: `rclone sync · Last: ${persistence.nextcloudSyncTime}`,
      note: "cloud.kdua.net · FTTH-GIS-Backups",
      status: persistence.nextcloudStatus,
    },
    {
      item: "Redis Keyspace",
      detail: `${redisKeysCached ?? "—"} keys cached`,
      note: "TTL avg: 300s · Eviction: allkeys-lru",
      status: "INFO" as const,
    },
  ];

  // ── Large objects: compute % of total
  const totalDbBytes = dbSizes.ftthGisBytes + dbSizes.keycloakBytes;
  const largeWithPct = largeObjects.map((obj) => ({
    ...obj,
    sizeMb: (obj.sizeBytes / (1024 * 1024)).toFixed(2),
    pct: totalDbBytes > 0 ? ((obj.sizeBytes / totalDbBytes) * 100).toFixed(1) : "—",
  }));

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <Database className="h-5 w-5 text-primary" />
            Database &amp; Cache
            <Badge className="ml-2 text-[10px] border-primary/20 bg-primary/10 text-primary animate-pulse">
              LIVE
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground">
            PostgreSQL metrics, Redis cache, Prometheus time-series charts · real-time via Spring Boot &amp; Prometheus.
            {lastUpdated && (
              <span className="ml-2 text-foreground/75 dark:text-muted-foreground font-mono">
                Updated {timeAgo(lastUpdated)}
              </span>
            )}
          </p>
        </div>
        <ActionTooltip label="Segarkan Database & Cache" shortcut="R">
          <Button
            variant="outline" size="sm"
            onClick={handleRefresh}
            disabled={systemData.refreshing || loading || loadingPersistence}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${(systemData.refreshing || loading) ? "animate-spin text-primary" : ""}`} />
            Refresh
          </Button>
        </ActionTooltip>
      </div>

      {/* ── 6 KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="PostgreSQL"
          value={postgresStatus ?? "—"}
          sub="ftth_gis primary database"
          icon={Database}
          accent={postgresStatus === "UP"}
        />
        <KpiCard
          label="Redis Cache"
          value={redisStatus ?? "—"}
          sub="Session & queue store"
          icon={Key}
          accent={redisStatus === "UP"}
        />
        <KpiCard
          label="DB Connections"
          value={postgresConns ? `${postgresConns} / 100` : `${pgConnectionsByState.active + pgConnectionsByState.idle} / 100`}
          sub={`Active: ${pgConnectionsByState.active} · Idle: ${pgConnectionsByState.idle}`}
          icon={Activity}
        />
        <KpiCard
          label="Redis Hit Ratio"
          value={redisCacheHit ? `${redisCacheHit}%` : "—%"}
          sub={`${redisKeysCached ?? "—"} keys · TTL avg 300s`}
          icon={Key}
        />
        <KpiCard
          label="PG Cache Hit"
          value={pgCacheHitRate > 0 ? `${pgCacheHitRate}%` : "—%"}
          sub="PostgreSQL buffer cache efficiency"
          icon={Database}
          accent={pgCacheHitRate >= 99}
        />
        <KpiCard
          label="Database Size"
          value={`${totalDbMb} MB`}
          sub={`Disk: ${diskUsedPct}% used · ${formatBytes(diskInfo.freeBytes)} free`}
          icon={HardDrive}
        />
      </div>

      {/* ── 6 Time-Series Charts (2-column grid) ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* 1. Memory Usage */}
        <ChartCard title="Memory Usage" source="Prometheus · node_memory">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={charts.memory} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="memUsed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="memCache" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} unit=" MB" width={52} />
              <Tooltip content={<CustomTooltip unit=" MB" />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="used" name="Used" stackId="1" stroke="var(--chart-1)" fill="url(#memUsed)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="cacheBuffers" name="Cache+Buf" stackId="1" stroke="var(--chart-2)" fill="url(#memCache)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2. CPU Usage */}
        <ChartCard title="CPU Usage" source="Prometheus · node_cpu">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={charts.cpu} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} width={36} />
              <Tooltip content={<CustomTooltip unit="%" />} />
              <Area type="monotone" dataKey="cpu" name="CPU" stroke="var(--chart-3)" fill="url(#cpuGrad)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 3. Network Throughput */}
        <ChartCard title="Network Throughput" source="Prometheus · node_network">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={charts.network} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="netIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="netOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-5)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} unit=" KB/s" width={52} />
              <Tooltip content={<CustomTooltip unit=" KB/s" />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="in" name="Inbound" stroke="var(--chart-2)" fill="url(#netIn)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="out" name="Outbound" stroke="var(--chart-5)" fill="url(#netOut)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 4. Disk IOPS */}
        <ChartCard title="Disk IOPS" source="Prometheus · node_disk">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={charts.iops} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} unit=" ops/s" width={52} />
              <Tooltip content={<CustomTooltip unit=" ops/s" />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="read" name="Read" stroke="var(--chart-4)" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="write" name="Write" stroke="var(--chart-1)" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 5. DB Connection Pool (HikariCP) */}
        <ChartCard title="DB Connection Pool" source="Prometheus · hikaricp">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={charts.connections} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="connActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="connIdle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={32} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="active" name="Active" stackId="1" stroke="var(--chart-1)" fill="url(#connActive)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="idle" name="Idle" stackId="1" stroke="var(--chart-2)" fill="url(#connIdle)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="pending" name="Pending" stackId="1" stroke="var(--chart-3)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 6. Disk Throughput */}
        <ChartCard title="Disk Throughput" source="Prometheus · node_disk">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={charts.diskThroughput} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} unit=" KB/s" width={52} />
              <Tooltip content={<CustomTooltip unit=" KB/s" />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="read" name="Read" stroke="var(--chart-4)" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="write" name="Write" stroke="var(--chart-5)" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* ── Large Objects Table ── */}
      {largeWithPct.length > 0 && (
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              Largest Database Objects
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Top 10 tables &amp; indexes by size · via{" "}
              <code className="font-mono text-[10px] bg-muted px-1 rounded">/api/v1/system/db-observability</code>
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-2.5 text-left font-semibold text-foreground/75 dark:text-muted-foreground">Object</th>
                    <th className="px-4 py-2.5 text-center font-semibold text-foreground/75 dark:text-muted-foreground">Type</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-foreground/75 dark:text-muted-foreground">Size</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-foreground/75 dark:text-muted-foreground">% of DB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {largeWithPct.map((obj, i) => (
                    <tr key={`${obj.name}-${i}`} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-foreground">{obj.name}</td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge className={`text-[10px] ${obj.type === "TABLE"
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-border/40 bg-muted/40 text-muted-foreground"}`}>
                          {obj.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-foreground">{obj.sizeMb} MB</td>
                      <td className="px-4 py-2.5 text-right text-foreground/75 dark:text-muted-foreground">{obj.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── DB Size Breakdown ── */}
      {dbSizes.totalBytes > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "ftth_gis", bytes: dbSizes.ftthGisBytes, desc: "Primary application DB" },
            { label: "keycloak_db", bytes: dbSizes.keycloakBytes, desc: "IAM / Identity store" },
            { label: "WAL Logs", bytes: dbSizes.walBytes, desc: "Write-Ahead Log buffer" },
          ].map((db) => (
            <Card key={db.label} className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Circle className="h-2 w-2 text-primary fill-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
                  {db.label}
                </span>
              </div>
              <p className="text-lg font-bold text-foreground font-mono">{formatBytes(db.bytes)}</p>
              <p className="text-xs text-muted-foreground">{db.desc}</p>
            </Card>
          ))}
        </div>
      )}

      {/* ── Persistence Integrity Table ── */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Archive className="h-4 w-4 text-muted-foreground" />
                Persistence Integrity
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Migration history, backup schedule, and sync status · via{" "}
                <code className="font-mono text-[10px] bg-muted px-1 rounded">/api/v1/system/devops-stats</code>
              </p>
            </div>
            {persistenceError && (
              <div className="flex items-center gap-1 text-[10px] text-amber-500">
                <AlertCircle className="h-3 w-3" />
                devops-stats unavailable
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {persistenceRows.map((row) => (
            <div key={row.item} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className={`h-3.5 w-3.5 shrink-0 ${
                    row.status === "SUCCESS" ? "text-primary" :
                    row.status === "FAILED" ? "text-rose-500" :
                    row.status === "INFO" ? "text-muted-foreground" :
                    "text-amber-500"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{row.item}</p>
                  <p className="text-xs text-muted-foreground">{row.note}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-foreground font-mono">
                  {loadingPersistence && row.status === "UNKNOWN" ? "Loading…" : row.detail}
                </p>
                <Badge className={`mt-1 text-[10px] ${statusBadgeClass(row.status)}`}>
                  {row.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Error notice ── */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-amber-500 border border-amber-500/20 bg-amber-500/5 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Prometheus metrics unavailable: {error}. Charts show fallback data.</span>
        </div>
      )}

    </PageLayout>
  );
}
