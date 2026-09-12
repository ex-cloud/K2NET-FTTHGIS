import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@k2net/ui";
import type { PollerDeviceStatus } from "@/lib/actions/gateways";

interface PollerEngineStatsCardProps {
  devices: PollerDeviceStatus[];
  loading: boolean;
}

export function PollerEngineStatsCard({ devices, loading }: PollerEngineStatsCardProps) {
  const activeCount = devices.filter((d) => d.status === "up").length;
  const downCount = devices.filter((d) => d.status === "down").length;
  const avgResponse =
    devices.length > 0
      ? `${Math.round(devices.reduce((s, d) => s + d.responseTimeMs, 0) / devices.length)}ms`
      : "...";

  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Poller Engine Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-muted-foreground">Active Devices</span>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">
            {loading ? "..." : activeCount}
          </Badge>
        </div>
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-muted-foreground">Down Devices</span>
          <Badge
            className={`text-[9px] ${
              !loading && downCount > 0
                ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                : "bg-muted/10 text-muted-foreground border-border"
            }`}
          >
            {loading ? "..." : downCount}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Avg Response</span>
          <Badge className="bg-muted/10 text-muted-foreground border-border text-[9px]">
            {loading ? "..." : avgResponse}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
