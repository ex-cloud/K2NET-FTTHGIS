import React from "react";
import { Card, Badge } from "@k2net/ui";
import { Gauge } from "lucide-react";

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function pct(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((used / total) * 100);
}

export function MetricCard({
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

export function LoadAvgCard({ load1, load5, load15, cores }: { load1: number; load5: number; load15: number; cores?: number }) {
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

export function ServiceCard({ job, up, memoryBytes }: { job: string; up: boolean; memoryBytes: number }) {
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

export function IntegrityCard({ icon: Icon, label, value, sub, status }: {
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

export function BucketCard({
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
