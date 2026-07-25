"use client";

import { Card, CardContent, CardHeader, CardTitle, Badge, PageLayout } from "@k2net/ui";
import { Wrench, CheckCircle2, Clock } from "lucide-react";
import { operationsServicesMock, scheduledJobsMock } from "@/lib/mock-data/observability-mock";

export default function OperationsPage() {
  return (
    <PageLayout variant="dashboard" spaceY="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <Wrench className="h-5 w-5 text-primary" />
            Operations Services
          </h1>
          <p className="text-xs text-muted-foreground">
            Scheduler, export, payment, and audit gateway performance matrix.
          </p>
        </div>
        <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-500 text-[10px]">MOCK DATA</Badge>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Scheduled Jobs Running", value: "2", sub: "2 active · 0 failed in 24h" },
          { label: "Export Tasks in Queue", value: "2", sub: "pending export jobs" },
          { label: "Payment Webhooks (24h)", value: "72", sub: "received · 0 failed" },
          { label: "Audit Logs Ingestion", value: "142 logs/hr", sub: "via ftth-audit-gateway:5006" },
        ].map((c) => (
          <Card key={c.label} className="p-5 flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{c.label}</span>
            <p className="text-xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </Card>
        ))}
      </div>

      {/* Operations Service Matrix */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Operations Service Matrix
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Current status and performance metrics for all 4 operational Go gateways.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_50px_80px_120px_70px_80px_70px] px-5 py-2 border-b border-border bg-muted/30 gap-2">
            {["Service", "Port", "Status", "Last Activity", "Queue", "Throughput", "Uptime"].map(h => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-border">
            {operationsServicesMock.map((s) => (
              <div key={s.service} className="grid grid-cols-[1fr_50px_80px_120px_70px_80px_70px] px-5 py-4 hover:bg-muted/20 transition-colors items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{s.service}</p>
                <p className="text-xs font-mono text-muted-foreground">{s.port}</p>
                <Badge className="text-[10px] w-fit bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  {s.status}
                </Badge>
                <p className="text-xs text-muted-foreground">{s.lastActivity}</p>
                <Badge className={`text-[10px] w-fit ${s.queueSize > 0 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-muted text-muted-foreground border-border"}`}>
                  {s.queueSize} pending
                </Badge>
                <p className="text-xs text-muted-foreground font-mono">{s.throughput}</p>
                <p className="text-xs text-muted-foreground">{s.uptime}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Jobs */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Scheduled Jobs (Crontab)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">All automated jobs managed by ftth-scheduler-gateway and system crontab.</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_110px_100px_100px_70px] px-5 py-2 border-b border-border bg-muted/30 gap-2">
            {["Job Name", "Cron Schedule", "Last Run", "Next Run", "Status"].map(h => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-border">
            {scheduledJobsMock.map((j) => (
              <div key={j.name} className="grid grid-cols-[1fr_110px_100px_100px_70px] px-5 py-3.5 hover:bg-muted/20 transition-colors items-center gap-2">
                <p className="text-sm font-medium text-foreground">{j.name}</p>
                <p className="text-xs font-mono text-muted-foreground">{j.cron}</p>
                <p className="text-xs font-mono text-muted-foreground">{j.lastRun}</p>
                <p className="text-xs font-mono text-muted-foreground">{j.nextRun}</p>
                <Badge className="text-[10px] w-fit flex items-center gap-1 bg-primary/10 text-primary border-primary/20">
                  <CheckCircle2 className="h-2.5 w-2.5" /> {j.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
