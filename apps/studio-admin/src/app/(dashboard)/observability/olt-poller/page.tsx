

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, PageLayout, ActionTooltip } from "@k2net/ui";
import {
  Radio, Network, AlertTriangle, RefreshCw, AlertCircle,
  CheckCircle2, XCircle, Clock, Cpu, Database,
} from "lucide-react";
import { useOltPollerObservability, OltDeviceLive } from "@/hooks/useOltPollerObservability";

// ─── Status badge config ─────────────────────────────────────────────────────
function SnmpBadge({ status }: { status: OltDeviceLive["snmpStatus"] }) {
  if (status === "UP")
    return (
      <Badge className="text-[10px] w-fit flex items-center gap-1 bg-primary/10 text-primary border-primary/20">
        <CheckCircle2 className="h-2.5 w-2.5" />
        UP
      </Badge>
    );
  if (status === "SLOW")
    return (
      <Badge className="text-[10px] w-fit flex items-center gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20">
        <AlertTriangle className="h-2.5 w-2.5" />
        SLOW
      </Badge>
    );
  return (
    <Badge className="text-[10px] w-fit flex items-center gap-1 bg-rose-500/10 text-rose-500 border-rose-500/20">
      <XCircle className="h-2.5 w-2.5" />
      DOWN
    </Badge>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, highlight,
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; highlight?: boolean;
}) {
  return (
    <Card glowingEffect className="p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${highlight ? "text-rose-500" : "text-muted-foreground"}`} />
      </div>
      <p className={`text-2xl font-bold ${highlight ? "text-rose-500" : "text-foreground"}`}>
        {value}
      </p>
      <p className="text-xs text-foreground/75 dark:text-muted-foreground">{sub}</p>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function OltPollerPage() {
  const {
    pollerInfo, devices, summary, loading, error, refresh, formatLastPolled,
  } = useOltPollerObservability();

  const pollerRunning = pollerInfo.status === "running";
  const redisConnected = pollerInfo.redisStatus === "connected";

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <Radio className="h-5 w-5 text-primary" />
            OLT &amp; Poller Telemetry
          </h1>
          <p className="text-xs text-foreground/75 dark:text-muted-foreground">
            SNMP device polling, optical attenuation readings, and OLT connectivity status &middot; via ftth-poller service.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <div className="flex items-center gap-1 text-[10px] text-amber-500">
              <AlertCircle className="h-3 w-3" />
              {error}
            </div>
          )}
          <Badge className={`text-[10px] ${pollerRunning ? "border-primary/20 bg-primary/10 text-primary" : "border-rose-500/20 bg-rose-500/10 text-rose-500"}`}>
            {loading ? "LOADING…" : pollerRunning ? "LIVE DATA" : "OFFLINE"}
          </Badge>
          <ActionTooltip label="Segarkan Telemetri OLT & Poller" shortcut="R">
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              Refresh
            </Button>
          </ActionTooltip>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={Network}
          label="Active OLT Connections"
          value={loading ? "…" : `${summary.onlineCount} / ${summary.totalDevices}`}
          sub="SNMP reachable devices"
        />
        <KpiCard
          icon={CheckCircle2}
          label="SNMP Ping Success"
          value={loading ? "…" : `${summary.snmpSuccessRate}%`}
          sub={`Last poll: ${formatLastPolled(summary.lastPolledAt)}`}
        />
        <KpiCard
          icon={Cpu}
          label="Poller Engine Status"
          value={loading ? "…" : pollerRunning ? "Running" : "Offline"}
          sub={pollerRunning
            ? `Interval: ${pollerInfo.pollInterval} · Redis: ${redisConnected ? "Connected" : "Disconnected"}`
            : "ftth-poller service unreachable"}
          highlight={!pollerRunning && !loading}
        />
        <KpiCard
          icon={Database}
          label="Devices Registered"
          value={loading ? "…" : String(pollerInfo.deviceCount || summary.totalDevices)}
          sub={`Across ${summary.totalDevices} active OLTs`}
        />
      </div>

      {/* Poller Engine Status Card */}
      {!loading && (
        <Card>
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              Poller Engine Health
            </CardTitle>
            <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
              Real-time operational status of the <code className="text-[10px] bg-muted px-1 py-0.5 rounded">ftth-poller</code> microservice.
            </p>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            {[
              {
                label: "Service Status",
                value: pollerInfo.status,
                badge: pollerRunning ? "bg-primary/10 text-primary border-primary/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20",
              },
              {
                label: "Poll Interval",
                value: pollerInfo.pollInterval,
                badge: "bg-muted text-muted-foreground border-border",
              },
              {
                label: "Redis Connection",
                value: pollerInfo.redisStatus,
                badge: redisConnected ? "bg-primary/10 text-primary border-primary/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20",
              },
              {
                label: "Devices Polling",
                value: String(pollerInfo.deviceCount),
                badge: "bg-muted text-muted-foreground border-border",
              },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center px-5 py-2.5">
                <span className="text-xs text-foreground/75 dark:text-muted-foreground">{row.label}</span>
                <Badge className={`text-[10px] font-mono ${row.badge}`}>{row.value || "—"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* OLT Telemetry Grid */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Network className="h-4 w-4 text-muted-foreground" />
            OLT Device Telemetry Grid
          </CardTitle>
          <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
            Physical OLT devices monitored by <code className="text-[10px] bg-muted px-1 py-0.5 rounded">ftth-poller</code> &middot; {devices.length} devices registered.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_110px_80px_70px_90px_100px] px-5 py-2 border-b border-border bg-muted/30 gap-2">
            {["Hostname", "IP Address", "Vendor", "SNMP", "Resp. Time", "Last Polled"].map(h => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
                {h}
              </span>
            ))}
          </div>
          <div className="divide-y divide-border">
            {devices.length === 0 ? (
              <div className="p-10 flex flex-col items-center gap-2 text-center">
                <Radio className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {loading ? "Loading OLT device telemetry…" : "No OLT devices registered. Add OLT devices in the Network module."}
                </p>
              </div>
            ) : (
              devices.map((d) => (
                <div
                  key={d.code}
                  className="grid grid-cols-[1fr_110px_80px_70px_90px_100px] px-5 py-3.5 hover:bg-muted/20 transition-colors items-center gap-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.hostname}</p>
                    <p className="text-[10px] text-foreground/75 dark:text-muted-foreground">{d.location}</p>
                  </div>
                  <p className="text-xs font-mono text-foreground/75 dark:text-muted-foreground">{d.ip}</p>
                  <Badge className="text-[10px] w-fit bg-muted text-muted-foreground border-border">{d.vendor}</Badge>
                  <SnmpBadge status={d.snmpStatus} />
                  <p className="text-xs font-mono text-foreground/75 dark:text-muted-foreground">
                    {d.responseTimeMs !== null ? `${d.responseTimeMs.toFixed(0)} ms` : "—"}
                  </p>
                  <div className="flex items-center gap-1">
                    {d.isLive && <Clock className="h-3 w-3 text-primary shrink-0" />}
                    <p className="text-[10px] font-mono text-foreground/75 dark:text-muted-foreground truncate">
                      {formatLastPolled(d.lastPolledAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

    </PageLayout>
  );
}
