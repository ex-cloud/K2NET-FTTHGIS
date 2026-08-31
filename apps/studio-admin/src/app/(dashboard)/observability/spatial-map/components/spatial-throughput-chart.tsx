

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@k2net/ui";
import { Layers } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { type MapTilePoint } from "@/hooks/useMapGatewayStats";

interface SpatialThroughputChartProps {
  chartData: MapTilePoint[];
  totalTiles: number;
}

export function SpatialThroughputChart({
  chartData,
  totalTiles,
}: SpatialThroughputChartProps) {
  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          Map Render Throughput — Last 24 Hours
        </CardTitle>
        <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
          Tile rendering load from ftth-map-gateway · Total {totalTiles.toLocaleString()} tiles rendered today.
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorTiles" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              interval={3}
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
            <Area
              type="monotone"
              dataKey="tiles"
              name="Tiles/sec"
              stroke="var(--primary)"
              fill="url(#colorTiles)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
