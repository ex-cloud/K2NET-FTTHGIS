"use client";

import { Card, CardContent, CardHeader, CardTitle, Badge, PageLayout } from "@k2net/ui";
import { Map, Layers, Globe } from "lucide-react";
import { mapTileRpsMock } from "@/lib/mock-data/observability-mock";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function SpatialMapPage() {
  const avgCacheHit = Math.round(mapTileRpsMock.reduce((a, b) => a + b.cacheHit, 0) / mapTileRpsMock.length);
  const totalTiles = mapTileRpsMock.reduce((a, b) => a + b.tiles, 0);
  const avgGeoLatency = Math.round(mapTileRpsMock.reduce((a, b) => a + b.geocoding, 0) / mapTileRpsMock.length);

  return (
    <PageLayout variant="dashboard" spaceY="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <Map className="h-5 w-5 text-primary" />
            Spatial Map Gateway
          </h1>
          <p className="text-xs text-muted-foreground">
            Map tile rendering throughput, Martin tile cache performance, and geocoding latency monitoring.
          </p>
        </div>
        <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-500 text-[10px]">MOCK DATA</Badge>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Tile Render RPS", value: "142", sub: "tiles/sec · peak 24h" },
          { label: "Martin Cache Hit", value: `${avgCacheHit}%`, sub: "tile cache hit ratio avg" },
          { label: "Geocoding Avg Latency", value: `${avgGeoLatency}ms`, sub: "map-gateway avg response" },
          { label: "Spatial DB Pool", value: "8 / 20", sub: "PostGIS connections in use" },
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
            <AreaChart data={mapTileRpsMock}>
              <defs>
                <linearGradient id="colorTiles" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
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
              { label: "Cache Backend", value: "Redis (RESP3)" },
              { label: "Cached Zoom Levels", value: "z10 — z18" },
              { label: "Max Cache Size", value: "2 GB" },
              { label: "Eviction Policy", value: "allkeys-lru" },
              { label: "Avg TTL", value: "3600s" },
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
              { label: "Provider", value: "HERE Maps API" },
              { label: "Quota Used (24h)", value: "2,841 / 10,000" },
              { label: "Avg Response", value: `${avgGeoLatency}ms` },
              { label: "Error Rate", value: "0.04%" },
              { label: "Cache Hit (geocoding)", value: "82%" },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center px-5 py-2.5">
                <span className="text-xs text-muted-foreground">{r.label}</span>
                <span className="text-xs font-medium text-foreground font-mono">{r.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
