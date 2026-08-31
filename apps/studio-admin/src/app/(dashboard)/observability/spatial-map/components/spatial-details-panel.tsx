

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@k2net/ui";
import { Globe } from "lucide-react";
import { type MapGatewayStats } from "@/hooks/useMapGatewayStats";

interface SpatialDetailsPanelProps {
  stats: MapGatewayStats;
  loading: boolean;
}

export function SpatialDetailsPanel({ stats, loading }: SpatialDetailsPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Martin Tile Cache */}
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            Martin Tile Cache
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {[
            { label: "Cache Backend",      value: "Redis (RESP3)" },
            { label: "Cached Zoom Levels", value: "z10 — z18" },
            { label: "Max Cache Size",     value: "2 GB" },
            { label: "Eviction Policy",    value: "allkeys-lru" },
            { label: "Avg TTL",            value: "3600s" },
          ].map((r) => (
            <div key={r.label} className="flex justify-between items-center px-5 py-2.5">
              <span className="text-xs text-foreground/75 dark:text-muted-foreground">
                {r.label}
              </span>
              <span className="text-xs font-medium text-foreground font-mono">
                {r.value}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Geocoding API */}
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
            {
              label: "Quota Used (24h)",
              value: loading
                ? "…"
                : `${stats.quotaUsed.toLocaleString()} / ${stats.quotaMax.toLocaleString()}`,
            },
            {
              label: "Avg Response",
              value: loading ? "…" : `${stats.geocodingAvgMs}ms`,
            },
            {
              label: "Error Rate",
              value: loading ? "…" : `${stats.errorRate.toFixed(2)}%`,
            },
            {
              label: "Cache Hit (geocoding)",
              value: loading ? "…" : `${stats.cacheHitPct}%`,
            },
          ].map((r) => (
            <div key={r.label} className="flex justify-between items-center px-5 py-2.5">
              <span className="text-xs text-foreground/75 dark:text-muted-foreground">
                {r.label}
              </span>
              <span className="text-xs font-medium text-foreground font-mono">
                {r.value}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
