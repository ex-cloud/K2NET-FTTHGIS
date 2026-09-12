import React from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
  Badge
} from "@k2net/ui";
import {
  CheckCircle2, Archive, AlertCircle, HardDrive, Circle
} from "lucide-react";

export interface PersistenceState {
  migrationVersion: string;
  migrationStatus: "SUCCESS" | "FAILED" | "UNKNOWN";
  migrationApplied: string;
  backupStatus: "SUCCESS" | "FAILED" | "UNKNOWN";
  backupLastRun: string;
  backupNextRun: string;
  minioSyncStatus: "SUCCESS" | "FAILED" | "UNKNOWN";
  minioSyncTime: string;
  nextcloudStatus: "SUCCESS" | "FAILED" | "UNKNOWN";
  nextcloudSyncTime: string;
}

function normalizeStatus(s?: string): "SUCCESS" | "FAILED" | "UNKNOWN" {
  if (s === "SUCCESS" || s === "FAILED") return s;
  return "UNKNOWN";
}

export function parsePersistenceData(d: Record<string, unknown>): PersistenceState {
  const lastMig = d?.lastMigration as { version?: string; success?: boolean; appliedAt?: string } | undefined;
  const lastBack = d?.lastBackup as { status?: string; lastBackupTime?: string; minioStatus?: string; minioSyncTime?: string; nextcloudStatus?: string; nextcloudSyncTime?: string } | undefined;
  return {
    migrationVersion: lastMig?.version || "—",
    migrationStatus: lastMig?.success ? "SUCCESS" : lastMig?.version ? "FAILED" : "UNKNOWN",
    migrationApplied: lastMig?.appliedAt || "—",
    backupStatus: normalizeStatus(lastBack?.status),
    backupLastRun: lastBack?.lastBackupTime || "—",
    backupNextRun: "Tonight 00:00 UTC",
    minioSyncStatus: normalizeStatus(lastBack?.minioStatus),
    minioSyncTime: lastBack?.minioSyncTime || "—",
    nextcloudStatus: normalizeStatus(lastBack?.nextcloudStatus),
    nextcloudSyncTime: lastBack?.nextcloudSyncTime || "—",
  };
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function timeAgo(date: Date | null): string {
  if (!date) return "";
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function statusBadgeClass(status: string) {
  if (status === "SUCCESS") return "border-primary/20 bg-primary/10 text-primary";
  if (status === "FAILED") return "border-rose-500/20 bg-rose-500/10 text-rose-500";
  return "border-border/40 bg-muted/40 text-muted-foreground";
}

export function DatabaseLargeObjectsTable({
  largeWithPct,
}: {
  largeWithPct: Array<{ name: string; type: string; sizeBytes: number; sizeMb: string; pct: string }>;
}) {
  return (
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
  );
}

export function DatabaseSizeCards({
  dbSizes,
}: {
  dbSizes: { ftthGisBytes: number; keycloakBytes: number; walBytes: number };
}) {
  return (
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
  );
}

export function DatabasePersistenceSection({
  persistenceRows,
  persistenceError,
  loadingPersistence,
}: {
  persistenceRows: Array<{ item: string; detail: string; note: string; status: string }>;
  persistenceError: boolean;
  loadingPersistence: boolean;
}) {
  return (
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
  );
}
