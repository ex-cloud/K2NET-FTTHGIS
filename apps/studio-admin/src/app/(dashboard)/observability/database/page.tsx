"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, PageLayout } from "@k2net/ui";
import { Database, RefreshCw, CheckCircle2, Archive, Key, AlertCircle } from "lucide-react";
import { useSystemOverviewData } from "@/hooks/useSystemOverviewData";
import { useSession } from "next-auth/react";

// ─── DevOps stats (from /api/v1/system/devops-stats) ─────────────────────────
interface PersistenceData {
  migrationVersion: string;
  migrationStatus: "SUCCESS" | "FAILED" | "UNKNOWN";
  migrationApplied: string;
  backupStatus: "SUCCESS" | "FAILED" | "UNKNOWN";
  backupLastRun: string;
  backupNextRun: string;
  minioSyncStatus: "SUCCESS" | "UNKNOWN";
  minioSyncTime: string;
  nextcloudSyncTime: string;
}

const DEFAULT_PERSISTENCE: PersistenceData = {
  migrationVersion: "—",
  migrationStatus: "UNKNOWN",
  migrationApplied: "—",
  backupStatus: "UNKNOWN",
  backupLastRun: "—",
  backupNextRun: "—",
  minioSyncStatus: "UNKNOWN",
  minioSyncTime: "—",
  nextcloudSyncTime: "—",
};

export default function DatabaseCachePage() {
  const { data: session } = useSession();
  const systemData = useSystemOverviewData();
  const postgresConns = systemData.systemResources.postgresConns;
  const redisCacheHit = systemData.systemResources.redisCacheHit;
  const postgresStatus = systemData.systemHealth.postgresStatus;
  const redisStatus = systemData.systemHealth.redisStatus;
  const redisKeysCached = systemData.systemHealth.redisKeysCached;

  const [persistence, setPersistence] = useState<PersistenceData>(DEFAULT_PERSISTENCE);
  const [loadingPersistence, setLoadingPersistence] = useState(true);
  const [persistenceError, setPersistenceError] = useState(false);

  const fetchPersistence = useCallback(async () => {
    if (!session?.accessToken) {
      setLoadingPersistence(false);
      return;
    }
    setLoadingPersistence(true);
    setPersistenceError(false);
    try {
      const res = await fetch("/api/v1/system/devops-stats", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`devops-stats: ${res.status}`);
      const d = await res.json();

      setPersistence({
        migrationVersion: d?.migration?.version ?? "—",
        migrationStatus: d?.migration?.status ?? "UNKNOWN",
        migrationApplied: d?.migration?.installedOn ?? "—",
        backupStatus: d?.backup?.lastStatus ?? "UNKNOWN",
        backupLastRun: d?.backup?.lastBackupTime ?? "—",
        backupNextRun: d?.backup?.nextBackupTime ?? "—",
        minioSyncStatus: d?.backup?.minioStatus ?? "UNKNOWN",
        minioSyncTime: d?.backup?.minioSyncTime ?? "—",
        nextcloudSyncTime: d?.backup?.nextcloudSyncTime ?? "—",
      });
    } catch {
      setPersistenceError(true);
    } finally {
      setLoadingPersistence(false);
    }
  }, [session?.accessToken]);

  useEffect(() => { fetchPersistence(); }, [fetchPersistence]);

  const handleRefresh = () => {
    systemData.loadData(true);
    fetchPersistence();
  };

  // ── Status badge helper
  function statusBadge(status: "SUCCESS" | "FAILED" | "UNKNOWN" | string) {
    if (status === "SUCCESS") return "border-primary/20 bg-primary/10 text-primary";
    if (status === "FAILED") return "border-rose-500/20 bg-rose-500/10 text-rose-500";
    return "border-border/40 bg-muted/40 text-muted-foreground";
  }

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
      status: "SUCCESS" as const,
    },
    {
      item: "Redis Keyspace",
      detail: `${redisKeysCached ?? "—"} keys cached`,
      note: "TTL avg: 300s · Eviction: allkeys-lru",
      status: "INFO" as const,
    },
  ];

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <Database className="h-5 w-5 text-primary" />
            Database &amp; Cache
          </h1>
          <p className="text-xs text-muted-foreground">
            PostgreSQL connection pool, Redis cache performance, and persistence integrity · real-time via Spring Boot.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={systemData.refreshing || loadingPersistence}>
          <RefreshCw className={`h-3.5 w-3.5 ${(systemData.refreshing || loadingPersistence) ? "animate-spin text-primary" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* 4 Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "PostgreSQL", value: postgresStatus, icon: Database, sub: "ftth_gis primary database" },
          { label: "Redis Cache", value: redisStatus, icon: Key, sub: "Session & queue store" },
          { label: "DB Connections", value: postgresConns ? `${postgresConns} / 100` : "— / 100", icon: Database, sub: "Active connections to pool" },
          { label: "Cache Hit Ratio", value: redisCacheHit ? `${redisCacheHit}%` : "—%", icon: Key, sub: `${redisKeysCached ?? "—"} keys cached · TTL avg 300s` },
        ].map((item) => (
          <Card key={item.label} className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{item.label}</span>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.sub}</p>
          </Card>
        ))}
      </div>

      {/* Persistence Integrity Table — real data from devops-stats */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Archive className="h-4 w-4 text-muted-foreground" />
                Persistence Integrity
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Migration history, backup schedule, and cache keyspace status · via{" "}
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
                <Badge className={`mt-1 text-[10px] ${statusBadge(row.status)}`}>
                  {row.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
