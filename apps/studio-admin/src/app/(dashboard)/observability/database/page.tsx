import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Badge, Button, PageLayout, ActionTooltip
} from "@k2net/ui";
import {
  Database, RefreshCw,
  Key, AlertCircle, HardDrive,
  Activity
} from "lucide-react";
import { useSystemOverviewData } from "@/hooks/useSystemOverviewData";
import { useDbObservability } from "@/hooks/useDbObservability";
import { useSession } from "@/lib/auth-compat";
import { DatabaseChartsSection } from "@/components/observability/database-charts-section";
import {
  formatBytes,
  timeAgo,
  parsePersistenceData,
  type PersistenceState,
  DatabaseLargeObjectsTable,
  DatabaseSizeCards,
  DatabasePersistenceSection,
} from "@/components/observability/database-persistence-section";

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

function DatabaseHeader({
  source,
  loading,
  lastUpdated,
  onRefresh,
  refreshing,
}: {
  source: string;
  loading: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
          <Database className="h-5 w-5 text-primary" />
          Database &amp; Cache
          <Badge className={`ml-2 text-[10px] ${source === "real" ? "border-primary/20 bg-primary/10 text-primary animate-pulse" : "border-amber-500/20 bg-amber-500/10 text-amber-500"}`}>
            {loading ? "LOADING…" : source === "real" ? "LIVE" : "PARTIAL"}
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
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
          Refresh
        </Button>
      </ActionTooltip>
    </div>
  );
}

function DatabaseKpiGrid({
  postgresStatus,
  redisStatus,
  postgresConns,
  pgConnectionsByState,
  redisCacheHit,
  redisKeysCached,
  pgCacheHitRate,
  totalDbMb,
  diskUsedPct,
  diskInfo,
}: {
  postgresStatus?: string;
  redisStatus?: string;
  postgresConns?: number;
  pgConnectionsByState: { active: number; idle: number };
  redisCacheHit?: number;
  redisKeysCached?: number;
  pgCacheHitRate: number;
  totalDbMb: string;
  diskUsedPct: number;
  diskInfo: { freeBytes: number };
}) {
  return (
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
  );
}

export default function DatabaseCachePage() {
  const { data: session } = useSession();
  const systemData = useSystemOverviewData();
  const {
    charts, dbObservability, source, loading, error,
    lastUpdated, refresh
  } = useDbObservability(30_000);

  const { postgresConns, redisCacheHit } = systemData.systemResources;
  const { postgresStatus, redisStatus, redisKeysCached } = systemData.systemHealth;

  const [persistence, setPersistence] = useState<PersistenceState>({
    migrationVersion: "—",
    migrationStatus: "UNKNOWN",
    migrationApplied: "—",
    backupStatus: "UNKNOWN",
    backupLastRun: "—",
    backupNextRun: "Tonight 00:00 UTC",
    minioSyncStatus: "UNKNOWN",
    minioSyncTime: "—",
    nextcloudStatus: "UNKNOWN",
    nextcloudSyncTime: "—",
  });

  const [loadingPersistence, setLoadingPersistence] = useState(true);
  const [persistenceError, setPersistenceError] = useState(false);

  const fetchPersistence = useCallback(async () => {
    try {
      setLoadingPersistence(true);
      const res = await fetch("/api/v1/system/devops-stats");
      if (!res.ok) throw new Error("Failed to fetch persistence info");
      const d = await res.json();
      setPersistence(parsePersistenceData(d));
    } catch {
      setPersistenceError(true);
    } finally {
      setLoadingPersistence(false);
    }
  }, []);

  const accessToken = (session as { accessToken?: string })?.accessToken;

  useEffect(() => {
    if (accessToken) fetchPersistence();
  }, [accessToken, fetchPersistence]);

  const handleRefresh = () => {
    systemData.loadData(true);
    refresh();
    fetchPersistence();
  };

  const { dbSizes, diskInfo, pgCacheHitRate, pgConnectionsByState, largeObjects } = dbObservability;
  const totalDbMb = (dbSizes.totalBytes / (1024 * 1024)).toFixed(1);
  const diskUsedPct = diskInfo.totalBytes > 0
    ? Math.round((diskInfo.usedBytes / diskInfo.totalBytes) * 100)
    : 0;

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
      status: "INFO",
    },
  ];

  const totalDbBytes = dbSizes.ftthGisBytes + dbSizes.keycloakBytes;
  const largeWithPct = largeObjects.map((obj) => ({
    ...obj,
    sizeMb: (obj.sizeBytes / (1024 * 1024)).toFixed(2),
    pct: totalDbBytes > 0 ? ((obj.sizeBytes / totalDbBytes) * 100).toFixed(1) : "—",
  }));

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <DatabaseHeader
        source={source}
        loading={loading}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        refreshing={systemData.refreshing || loading || loadingPersistence}
      />

      <DatabaseKpiGrid
        postgresStatus={postgresStatus}
        redisStatus={redisStatus}
        postgresConns={postgresConns}
        pgConnectionsByState={pgConnectionsByState}
        redisCacheHit={redisCacheHit}
        redisKeysCached={redisKeysCached}
        pgCacheHitRate={pgCacheHitRate}
        totalDbMb={totalDbMb}
        diskUsedPct={diskUsedPct}
        diskInfo={diskInfo}
      />

      <DatabaseChartsSection charts={charts} />

      {largeWithPct.length > 0 && (
        <DatabaseLargeObjectsTable largeWithPct={largeWithPct} />
      )}

      {dbSizes.totalBytes > 0 && (
        <DatabaseSizeCards dbSizes={dbSizes} />
      )}

      <DatabasePersistenceSection
        persistenceRows={persistenceRows}
        persistenceError={persistenceError}
        loadingPersistence={loadingPersistence}
      />

      {error && (
        <div className="flex items-center gap-2 text-xs text-amber-500 border border-amber-500/20 bg-amber-500/5 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Prometheus metrics unavailable: {error}. Charts show fallback data.</span>
        </div>
      )}
    </PageLayout>
  );
}
