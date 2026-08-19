"use client";

import { Card, CardContent, CardHeader, CardTitle, Badge, Button, PageLayout, ActionTooltip } from "@k2net/ui";
import {
  Globe,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Cpu,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ServerCrash,
  Puzzle,
} from "lucide-react";
import { useKongRoutes, useKongTraffic } from "@/hooks/useKongObservability";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

// ── Status indicator component ─────────────────────────────────────────────
function RouteStatusDot({ status }: { status: "UP" | "DOWN" | "UNKNOWN" }) {
  if (status === "UP")
    return (
      <span className="flex items-center gap-1 text-primary text-[10px] font-medium">
        <CheckCircle2 className="h-3.5 w-3.5" />
        UP
      </span>
    );
  if (status === "DOWN")
    return (
      <span className="flex items-center gap-1 text-rose-500 text-[10px] font-medium">
        <XCircle className="h-3.5 w-3.5" />
        DOWN
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-amber-500 text-[10px] font-medium">
      <HelpCircle className="h-3.5 w-3.5" />
      UNK
    </span>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────
function EmptyRoutes({ error }: { error: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <ServerCrash className="h-10 w-10 text-muted-foreground/40" />
      <div>
        <p className="text-sm font-semibold text-foreground">
          Tidak ada route yang dapat dimuat
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {error
            ? `Error: ${error}`
            : "Kong Admin API tidak merespons atau belum ada route yang terdaftar."}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Periksa bahwa container <code className="font-mono text-primary">kong</code> berjalan
          dan port <code className="font-mono text-primary">8001</code> dapat diakses dari jaringan Docker internal.
        </p>
      </div>
    </div>
  );
}

export default function ApiGatewayPage() {
  const { routes, loading: loadingRoutes, error: routesError, refresh: refreshRoutes } =
    useKongRoutes();
  const { metrics, loading: loadingTraffic, error: trafficError, refresh: refreshTraffic } =
    useKongTraffic();

  const handleRefresh = () => {
    refreshRoutes();
    refreshTraffic();
  };
  const isLoading = loadingRoutes || loadingTraffic;
  const hasError = routesError || trafficError;

  // KPI derived from real Kong data
  const totalReq = metrics?.totalRequests ?? 0;
  const activeConns = metrics?.activeConnections ?? 0;
  const trafficHistory = metrics?.trafficHistory ?? [];
  const isKongUp = metrics?.source === "kong-admin";
  const configHash = metrics?.configHash ?? "unknown";
  const workerMemoryMiB = metrics?.workerMemoryMiB ?? 0;
  const workerCount = metrics?.workerCount ?? 0;

  const routesUp = routes.filter((r) => r.status === "UP").length;
  const routesDown = routes.filter((r) => r.status === "DOWN").length;

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <Globe className="h-5 w-5 text-primary" />
            API Gateway Monitor
          </h1>
          <p className="text-xs text-foreground/75 dark:text-muted-foreground">
            Kong &amp; Traefik ingress traffic, route health, error rates — real-time via Kong Admin API.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasError && (
            <div className="flex items-center gap-1 text-[10px] text-amber-500">
              <AlertCircle className="h-3 w-3" />
              {routesError ?? trafficError}
            </div>
          )}
          <Badge
            className={
              isKongUp
                ? "border-primary/20 bg-primary/10 text-primary text-[10px]"
                : "border-amber-500/20 bg-amber-500/10 text-amber-500 text-[10px]"
            }
          >
            {isKongUp ? "LIVE" : "OFFLINE"}
          </Badge>
          <ActionTooltip label="Segarkan Metrik API Gateway" shortcut="R">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
              Refresh
            </Button>
          </ActionTooltip>
        </div>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            label: "Total Requests",
            value: loadingTraffic ? "…" : totalReq > 0 ? totalReq.toLocaleString() : "—",
            sub: "Requests handled · Kong Admin",
            icon: TrendingUp,
          },
          {
            label: "Active Connections",
            value: loadingTraffic ? "…" : String(activeConns),
            sub: "Active nginx worker connections",
            icon: Globe,
          },
          {
            label: "Active Routes",
            value: loadingRoutes ? "…" : String(routes.length),
            sub: `${routesUp} UP · ${routesDown > 0 ? `${routesDown} DOWN · ` : ""}Kong declarative`,
            icon: ShieldCheck,
          },
          {
            label: "Config Hash",
            value: loadingTraffic
              ? "…"
              : configHash !== "unknown"
              ? configHash.slice(0, 8) + "…"
              : "—",
            sub: "DB-less declarative mode · Kong",
            icon: ShieldCheck,
          },
          {
            label: "Worker Memory",
            value: loadingTraffic
              ? "…"
              : workerMemoryMiB > 0
              ? `${workerMemoryMiB.toFixed(0)} MiB`
              : "—",
            sub: `${workerCount} Lua workers · GC allocated`,
            icon: Cpu,
          },
        ].map((c) => (
          <Card glowingEffect key={c.label} className="p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
                {c.label}
              </span>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </Card>
        ))}
      </div>

      {/* Kong Traffic Area Chart */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground">
            HTTP Traffic via Kong — Last 12 Hours
          </CardTitle>
          <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
            Requests routed per upstream service group ·{" "}
            {isKongUp ? "Kong Admin API" : "offline — no data"}
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={
                trafficHistory.length > 0
                  ? trafficHistory
                  : [{ hour: "—", api: 0, gateways: 0 }]
              }
            >
              <defs>
                <linearGradient id="colorApi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorGw" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2, hsl(200 80% 50%))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--chart-2, hsl(200 80% 50%))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="api"
                name="API Gateway"
                stroke="var(--primary)"
                fill="url(#colorApi)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="gateways"
                name="Go Gateways"
                stroke="var(--chart-2, hsl(200 80% 50%))"
                fill="url(#colorGw)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Kong Routes Table — real data */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground">
            Active Kong Routes
          </CardTitle>
          <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
            All configured routes via Kong Admin API &mdash; {routes.length} routes registered.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="grid grid-cols-[160px_1fr_80px_1fr_100px] px-5 py-2 border-b border-border bg-muted/30 gap-2">
            {["Route", "Upstream", "Methods", "Plugins", "Status"].map((h) => (
              <span
                key={h}
                className="text-[10px] font-bold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground"
              >
                {h}
              </span>
            ))}
          </div>

          {/* Table rows */}
          <div className="divide-y divide-border">
            {!loadingRoutes && routes.length === 0 ? (
              <EmptyRoutes error={routesError} />
            ) : loadingRoutes ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              routes.map((r) => (
                <div
                  key={r.routeId ?? r.route}
                  className="grid grid-cols-[160px_1fr_80px_1fr_100px] px-5 py-3 hover:bg-muted/20 transition-colors items-center gap-2"
                >
                  <p className="text-xs font-mono text-foreground truncate">{r.route}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {r.upstream}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{r.methods}</p>
                  <div className="flex flex-wrap gap-1">
                    {r.plugins.length > 0 ? (
                      r.plugins.map((p) => (
                        <Badge
                          key={p}
                          className="text-[9px] font-mono border-border bg-muted/60 text-muted-foreground flex items-center gap-0.5"
                        >
                          <Puzzle className="h-2 w-2" />
                          {p}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50 italic">—</span>
                    )}
                  </div>
                  <RouteStatusDot status={r.status} />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
