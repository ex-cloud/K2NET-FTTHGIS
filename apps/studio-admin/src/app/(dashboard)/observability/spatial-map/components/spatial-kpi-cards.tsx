"use client";

import React from "react";
import { Card } from "@k2net/ui";
import { type MapGatewayStats } from "@/hooks/useMapGatewayStats";

interface SpatialKpiCardsProps {
  stats: MapGatewayStats;
  loading: boolean;
}

export function SpatialKpiCards({ stats, loading }: SpatialKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[
        {
          label: "Tile Render RPS",
          value: loading ? "…" : `${stats.tileRps}`,
          sub: "tiles/sec · current",
        },
        {
          label: "Martin Cache Hit",
          value: loading ? "…" : `${stats.cacheHitPct}%`,
          sub: "tile cache hit ratio",
        },
        {
          label: "Geocoding Avg Latency",
          value: loading ? "…" : `${stats.geocodingAvgMs}ms`,
          sub: "map-gateway avg response",
        },
        {
          label: "Spatial DB Pool",
          value: loading ? "…" : `${stats.spatialDbPoolUsed} / ${stats.spatialDbPoolMax}`,
          sub: "PostGIS connections in use",
        },
      ].map((c) => (
        <Card key={c.label} className="p-5 flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
            {c.label}
          </span>
          <p className="text-2xl font-bold text-foreground font-mono">{c.value}</p>
          <p className="text-xs text-foreground/75 dark:text-muted-foreground">{c.sub}</p>
        </Card>
      ))}
    </div>
  );
}
