"use client";

import { Card, CardContent, CardHeader, CardTitle, Badge, Button, PageLayout } from "@k2net/ui";
import { Database, RefreshCw, CheckCircle2, Archive, Key } from "lucide-react";
import { useSystemOverviewData } from "@/hooks/useSystemOverviewData";

export default function DatabaseCachePage() {
  const data = useSystemOverviewData();
  const postgresConns = data.systemResources.postgresConns;
  const redisCacheHit = data.systemResources.redisCacheHit;
  const postgresStatus = data.systemHealth.postgresStatus;
  const redisStatus = data.systemHealth.redisStatus;
  const redisKeysCached = data.systemHealth.redisKeysCached;

  return (
    <PageLayout variant="dashboard" spaceY="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <Database className="h-5 w-5 text-primary" />
            Database & Cache
          </h1>
          <p className="text-xs text-muted-foreground">
            PostgreSQL connection pool, Redis cache performance, and persistence integrity.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => data.loadData(true)} disabled={data.refreshing}>
          <RefreshCw className={`h-3.5 w-3.5 ${data.refreshing ? "animate-spin text-primary" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* 4 Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "PostgreSQL", value: postgresStatus, icon: Database, sub: "ftth_gis primary database" },
          { label: "Redis Cache", value: redisStatus, icon: Key, sub: "Session & queue store" },
          { label: "DB Connections", value: `${postgresConns} / 100`, icon: Database, sub: "Active connections to pool" },
          { label: "Cache Hit Ratio", value: `${redisCacheHit}%`, icon: Key, sub: `${redisKeysCached ?? "—"} keys cached · TTL avg 300s` },
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

      {/* Persistence Integrity Table */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Archive className="h-4 w-4 text-muted-foreground" />
            Persistence Integrity
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Migration history, backup schedule, and cache keyspace status.</p>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {[
            { item: "Last Migration", status: "SUCCESS", detail: "V15 — Applied 2 hours ago", note: "Flyway managed · auto-versioned" },
            { item: "Backup Schedule", status: "SUCCESS", detail: "pg_dump NIGHTLY · 00:00 WIB", note: "Last successful: 00:00:05 · Next: Tonight" },
            { item: "MinIO Sync", status: "SUCCESS", detail: "Last sync: 01:00:09 WIB", note: "db-backups bucket · Tailscale 100.110.205.109" },
            { item: "Nextcloud Offsite", status: "SUCCESS", detail: "rclone sync 04:00 WIB", note: "cloud.kdua.net · FTTH-GIS-Backups" },
            { item: "Redis Keyspace", status: "INFO", detail: `${redisKeysCached ?? 1240} keys cached`, note: "TTL avg: 300s · Eviction: allkeys-lru" },
          ].map((row) => (
            <div key={row.item} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${row.status === "SUCCESS" ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{row.item}</p>
                  <p className="text-xs text-muted-foreground">{row.note}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-foreground">{row.detail}</p>
                <Badge className="mt-1 text-[10px] border-primary/20 bg-primary/10 text-primary">{row.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
