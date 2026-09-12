import React from "react";
import { Activity, Cpu, MemoryStick, Database, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@k2net/ui";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { BucketCard } from "./compute-metric-cards";
import type { ComputeChartPoint } from "@/hooks/useComputeObservability";

const CHART_TOOLTIP_STYLE = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 };

export function ComputeChartsSection({
  charts,
}: {
  charts: {
    http: ComputeChartPoint[];
    cpu: ComputeChartPoint[];
    memory: ComputeChartPoint[];
  };
}) {
  return (
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
  );
}

export function DisasterRecoverySection({
  backup,
}: {
  backup: {
    status?: string;
    lastBackupTime?: string;
    nextBackupTime?: string;
    minioStatus?: string;
    nextcloudStatus?: string;
    nextcloudSyncTime?: string;
    dbBackups?: { totalSize?: number; totalFiles?: number | string };
    codeBackups?: { totalSize?: number; totalFiles?: number | string };
    dockerBackups?: { totalSize?: number; totalFiles?: number | string };
  };
}) {
  return (
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

      {/* Nextcloud Layer 3 */}
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
  );
}
