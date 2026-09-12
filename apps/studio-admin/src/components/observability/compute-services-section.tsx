import React from "react";
import { Activity, GitBranch, Server, Archive, Circle } from "lucide-react";
import { Card } from "@k2net/ui";
import { ServiceCard, IntegrityCard } from "./compute-metric-cards";

export function ComputeServicesSection({
  services,
}: {
  services: Array<{ job: string; up: boolean; memoryBytes: number }>;
}) {
  const onlineCount = services.filter(s => s.up).length;
  const offlineCount = services.filter(s => !s.up).length;

  return (
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
  );
}

export function ComputeIntegritySection({
  compute,
  migration,
  backup,
}: {
  compute: {
    heapUsedMb: number;
    heapMaxMb: number;
    usedMemoryMb: number;
    maxMemoryMb: number;
    nonHeapUsedMb: number;
    javaVersion?: string;
  };
  migration: {
    version: string;
    success: boolean;
    installedOn: string;
  };
  backup: {
    status?: string;
    lastBackupTime?: string;
    nextBackupTime?: string;
  };
}) {
  return (
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
  );
}
