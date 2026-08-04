"use client";

import { Card, CardContent, CardHeader, CardTitle, Badge, Button, PageLayout } from "@k2net/ui";
import { Map as MapIcon, Layers, Globe, RefreshCw, AlertCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { SpatialDiagnosticsMap } from "@/components/map/spatial-diagnostics-map";
import { useMapGatewayStats } from "@/hooks/useMapGatewayStats";

export default function SpatialMapPage() {
  const { stats, chartData, loading, error, refresh } = useMapGatewayStats();

  const totalTiles = chartData.reduce((a, b) => a + b.tiles, 0);

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <MapIcon className="h-5 w-5 text-primary" />
            Spatial Map Gateway
          </h1>
          <p className="text-xs text-muted-foreground">
            Map tile rendering throughput, Martin tile cache performance, and geocoding latency · via map-gateway.
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
            {loading ? "LOADING…" : stats.status === "fallback" ? "ESTIMATED" : "LIVE DATA"}
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
          { label: "Tile Render RPS",        value: loading ? "…" : `${stats.tileRps}`,               sub: "tiles/sec · current" },
          { label: "Martin Cache Hit",        value: loading ? "…" : `${stats.cacheHitPct}%`,          sub: "tile cache hit ratio" },
          { label: "Geocoding Avg Latency",  value: loading ? "…" : `${stats.geocodingAvgMs}ms`,       sub: "map-gateway avg response" },
          { label: "Spatial DB Pool",        value: loading ? "…" : `${stats.spatialDbPoolUsed} / ${stats.spatialDbPoolMax}`, sub: "PostGIS connections in use" },
        ].map((c) => (
          <Card key={c.label} className="p-5 flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{c.label}</span>
            <p className="text-2xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </Card>
        ))}
      </div>

      {/* Tile Render Throughput Chart */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            Map Render Throughput — Last 24 Hours
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tile rendering load from ftth-map-gateway · Total {totalTiles.toLocaleString()} tiles rendered today.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTiles" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="tiles" name="Tiles/sec" stroke="var(--primary)" fill="url(#colorTiles)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cache & Geocoding Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">Martin Tile Cache</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            {[
              { label: "Cache Backend",      value: "Redis (RESP3)" },
              { label: "Cached Zoom Levels", value: "z10 — z18" },
              { label: "Max Cache Size",     value: "2 GB" },
              { label: "Eviction Policy",    value: "allkeys-lru" },
              { label: "Avg TTL",            value: "3600s" },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center px-5 py-2.5">
                <span className="text-xs text-muted-foreground">{r.label}</span>
                <span className="text-xs font-medium text-foreground font-mono">{r.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Geocoding API
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            {[
              { label: "Provider",              value: "HERE Maps API" },
              { label: "Quota Used (24h)",      value: loading ? "…" : `${stats.quotaUsed.toLocaleString()} / ${stats.quotaMax.toLocaleString()}` },
              { label: "Avg Response",          value: loading ? "…" : `${stats.geocodingAvgMs}ms` },
              { label: "Error Rate",            value: loading ? "…" : `${stats.errorRate.toFixed(2)}%` },
              { label: "Cache Hit (geocoding)", value: loading ? "…" : `${stats.cacheHitPct}%` },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center px-5 py-2.5">
                <span className="text-xs text-muted-foreground">{r.label}</span>
                <span className="text-xs font-medium text-foreground font-mono">{r.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Global Spatial Explorer MapLibre Canvas Section */}
      <SpatialDiagnosticsMap />
    </PageLayout>
  );
}
