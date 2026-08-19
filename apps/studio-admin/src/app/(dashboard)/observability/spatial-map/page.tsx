"use client";

import React from "react";
import { Badge, Button, PageLayout, ActionTooltip } from "@k2net/ui";
import { Map as MapIcon, RefreshCw, AlertCircle } from "lucide-react";
import { SpatialDiagnosticsMap } from "@/components/map/spatial-diagnostics-map";
import { useMapGatewayStats } from "@/hooks/useMapGatewayStats";
import { SpatialKpiCards } from "./components/spatial-kpi-cards";
import { SpatialThroughputChart } from "./components/spatial-throughput-chart";
import { SpatialDetailsPanel } from "./components/spatial-details-panel";

export default function SpatialMapPage() {
  const { stats, chartData, loading, error, refresh } = useMapGatewayStats();

  const totalTiles = chartData.reduce((a, b) => a + b.tiles, 0);

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <MapIcon className="h-5 w-5 text-primary" />
            Spatial Map Gateway
          </h1>
          <p className="text-xs text-foreground/75 dark:text-muted-foreground">
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
            {loading ? "LOADING…" : stats.status === "fallback" || stats.status === "degraded" ? "ESTIMATED" : "LIVE DATA"}
          </Badge>
          <ActionTooltip label="Segarkan Metrik Spatial Gateway" shortcut="R">
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              Refresh
            </Button>
          </ActionTooltip>
        </div>
      </div>

      {/* ── 4 KPI Cards ── */}
      <SpatialKpiCards stats={stats} loading={loading} />

      {/* ── Tile Render Throughput Chart ── */}
      <SpatialThroughputChart chartData={chartData} totalTiles={totalTiles} />

      {/* ── Cache & Geocoding Details Panel ── */}
      <SpatialDetailsPanel stats={stats} loading={loading} />

      {/* ── Global Spatial Explorer MapLibre Canvas Section ── */}
      <SpatialDiagnosticsMap />
    </PageLayout>
  );
}
