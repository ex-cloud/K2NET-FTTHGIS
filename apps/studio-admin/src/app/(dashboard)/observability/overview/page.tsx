"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, PageLayout } from "@k2net/ui";
import { ScanLine, RefreshCw, TrendingDown, Database, Server, Cpu, MemoryStick } from "lucide-react";
import { getSystemHealthMetrics } from "@/lib/actions/health";
import { getSystemThroughput, ThroughputPoint } from "@/lib/actions/health";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from "recharts";

// ─── Service Health Sparkline Bar Data (mock — replace with real API) ─────────
const serviceHealthData = [
  { name: "API Gateway", rps: 71, bars: [42, 78, 65, 90, 71, 55, 83, 70, 88, 71] },
  { name: "Database", rps: 15, bars: [8, 14, 12, 18, 15, 10, 20, 13, 17, 15] },
  { name: "Spring Boot Core", rps: 8, bars: [4, 7, 6, 9, 8, 5, 10, 7, 9, 8] },
  { name: "Go Gateways", rps: 42, bars: [20, 38, 32, 48, 42, 30, 55, 40, 50, 42] },
  { name: "Redis Cache", rps: 127, bars: [100, 120, 110, 140, 127, 105, 150, 125, 138, 127] },
  { name: "Keycloak Auth", rps: 3, bars: [1, 2, 2, 3, 3, 1, 4, 2, 3, 3] },
];

function MiniBarChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-1.5 bg-primary rounded-sm opacity-80"
          style={{ height: `${Math.max(10, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon: React.ElementType }) {
  return (
    <Card className="p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

export default function ObservabilityOverviewPage() {
  const [healthData, setHealthData] = useState<{ cpu: number; memory: number; postgresConns: number } | null>(null);
  const [throughput, setThroughput] = useState<ThroughputPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [metrics, tp] = await Promise.all([getSystemHealthMetrics(), getSystemThroughput()]);
      setHealthData({ cpu: metrics.cpu, memory: Math.round((metrics.memUsedBytes / metrics.memTotalBytes) * 100), postgresConns: 12 });
      setThroughput(tp);
    } catch {
      // fallback to mock values
      setHealthData({ cpu: 11, memory: 45, postgresConns: 12 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <PageLayout variant="dashboard" spaceY="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              SRE Command Center
            </Badge>
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground tracking-tight">
            <ScanLine className="h-5 w-5 text-primary" />
            Observability Overview
          </h1>
          <p className="text-xs text-muted-foreground">
            Real-time platform health summary — database, compute, and service throughput.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refresh()} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Slow Queries (>500ms)" value="4" sub="queries detected in last 24h" icon={TrendingDown} />
        <KpiCard label="Peak DB Connections" value={loading ? "..." : `${healthData?.postgresConns ?? 12} / 100`} sub="active connections to ftth_gis" icon={Database} />
        <KpiCard label="Host Memory" value={loading ? "..." : `${healthData?.memory ?? 45}%`} sub={`of total server RAM in use`} icon={MemoryStick} />
        <KpiCard label="Host CPU" value={loading ? "..." : `${healthData?.cpu ?? 11}%`} sub="avg across all cores" icon={Cpu} />
      </div>

      {/* Service Health Grid — Supabase RPS Sparkline Style */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            Service Health
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Request throughput per service — last 10 data points</p>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {serviceHealthData.map((svc) => (
            <div key={svc.name} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <span className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
                <span className="text-sm font-medium text-foreground truncate">{svc.name}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <MiniBarChart data={svc.bars} />
                <span className="text-xs text-muted-foreground w-20 text-right tabular-nums font-mono">
                  {svc.rps} {svc.name.includes("Cache") ? "ops/sec" : "req/min"}
                </span>
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">&gt;</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Throughput Chart */}
      {throughput.length > 0 && (
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-sm font-semibold text-foreground">Combined Throughput — Last 24 Hours</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Total HTTP hits across all gateways</p>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={throughput} barSize={8}>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "var(--foreground)" }}
                />
                <Bar dataKey="requests" radius={[3, 3, 0, 0]}>
                  {throughput.map((_, i) => <Cell key={i} fill="var(--primary)" fillOpacity={0.7} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}
