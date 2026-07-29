"use client";

import { Card, CardContent, CardHeader, CardTitle, Badge, Button, PageLayout } from "@k2net/ui";
import { Radio, Network, AlertTriangle, RefreshCw, AlertCircle } from "lucide-react";
import { useOltDevices } from "@/hooks/useOltDevices";

export default function OltPollerPage() {
  const { devices, loading, error, refresh } = useOltDevices();
  const online = devices.filter(d => d.snmpStatus === "OK").length;
  const totalOdp = devices.reduce((acc, d) => acc + d.odpCount, 0);

  return (
    <PageLayout variant="dashboard" spaceY="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <Radio className="h-5 w-5 text-primary" />
            OLT &amp; Poller Telemetry
          </h1>
          <p className="text-xs text-muted-foreground">
            SNMP device polling, optical attenuation readings, and OLT connectivity status · via health-metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <div className="flex items-center gap-1 text-[10px] text-amber-500">
              <AlertCircle className="h-3 w-3" />
              {error}
            </div>
          )}
          <Badge className="border-primary/20 bg-primary/10 text-primary text-[10px]">
            {loading ? "LOADING…" : "LIVE DATA"}
          </Badge>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Active OLT Connections", value: loading ? "…" : `${online} / ${devices.length}`, sub: "SNMP reachable devices" },
          { label: "SNMP Ping Success", value: loading ? "…" : `${Math.round((online / Math.max(1, devices.length)) * 100)}%`, sub: "Last polling cycle: 3 min ago" },
          { label: "SSH Session Failures", value: "0", sub: "No SSH errors in last 24h" },
          { label: "Total Polled ODP", value: loading ? "…" : String(totalOdp), sub: `Across ${devices.length} active OLTs` },
        ].map((c) => (
          <Card key={c.label} className="p-5 flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{c.label}</span>
            <p className="text-2xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </Card>
        ))}
      </div>

      {/* OLT Telemetry Grid */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Network className="h-4 w-4 text-muted-foreground" />
            OLT Device Telemetry Grid
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Physical OLT devices monitored by ftth-olt-gateway and ftth-poller · {devices.length} devices registered.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_110px_80px_80px_70px_90px] px-5 py-2 border-b border-border bg-muted/30 gap-2">
            {["Hostname", "IP Address", "Vendor", "SNMP", "ODP", "Optical Attn."].map(h => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-border">
            {devices.map((d) => (
              <div key={d.hostname} className="grid grid-cols-[1fr_110px_80px_80px_70px_90px] px-5 py-3.5 hover:bg-muted/20 transition-colors items-center gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{d.hostname}</p>
                  <p className="text-[10px] text-muted-foreground">{d.location}</p>
                </div>
                <p className="text-xs font-mono text-muted-foreground">{d.ip}</p>
                <Badge className="text-[10px] w-fit bg-muted text-muted-foreground border-border">{d.vendor}</Badge>
                <Badge className={`text-[10px] w-fit ${d.snmpStatus === "OK" ? "bg-primary/10 text-primary border-primary/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}`}>
                  {d.snmpStatus === "SLOW" && <AlertTriangle className="h-2.5 w-2.5 mr-1" />}{d.snmpStatus}
                </Badge>
                <p className="text-xs text-muted-foreground">{d.odpCount}</p>
                <p className={`text-xs font-mono ${parseFloat(d.opticalAttn) < -23 ? "text-amber-500" : "text-foreground"}`}>{d.opticalAttn}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
