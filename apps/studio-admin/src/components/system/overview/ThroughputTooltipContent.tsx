import { Badge } from "@k2net/ui";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
} from "lucide-react";
import type {
  EnrichedThroughputPoint,
  ServiceFilterType,
  CustomTooltipProps,
} from "./overview-throughput-types";

interface FloatingRichTooltipContentProps {
  point: EnrichedThroughputPoint;
  serviceFilter: ServiceFilterType;
}

export function FloatingRichTooltipContent({
  point,
  serviceFilter,
}: FloatingRichTooltipContentProps) {
  return (
    <div className="w-72 rounded-xl border border-border/80 bg-card/95 p-3.5 shadow-lg backdrop-blur-xl text-xs space-y-3 pointer-events-none select-none z-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span>{point.timeRange} WIB</span>
        </div>
        <Badge
          variant="outline"
          className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px] px-1.5 py-0"
        >
          {point.latencyMs}ms avg
        </Badge>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
          <p className="text-[10px] text-muted-foreground">Volume Request</p>
          <p className="text-sm font-bold font-mono text-foreground mt-0.5">
            {point.filteredHits.toLocaleString()}{" "}
            <span className="text-[10px] font-normal text-muted-foreground">
              reqs
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
          <p className="text-[10px] text-muted-foreground">Peak Throughput</p>
          <p className="text-sm font-bold font-mono text-primary mt-0.5">
            {point.peakRpm}{" "}
            <span className="text-[10px] font-normal text-muted-foreground">
              rpm
            </span>
          </p>
        </div>
      </div>

      {/* HTTP Status Breakdown */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-semibold text-muted-foreground">HTTP Status Distribution</span>
          <span className="font-mono text-primary font-bold">
            {point.successRate}% Success
          </span>
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            style={{ width: `${(point.successCount / Math.max(1, point.filteredHits)) * 100}%` }}
            className="bg-primary transition-all duration-300"
          />
          <div
            style={{ width: `${(point.clientErrCount / Math.max(1, point.filteredHits)) * 100}%` }}
            className="bg-amber-500 transition-all duration-300"
          />
          <div
            style={{ width: `${(point.serverErrCount / Math.max(1, point.filteredHits)) * 100}%` }}
            className="bg-destructive transition-all duration-300"
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
          <span className="flex items-center gap-1 text-foreground">
            <CheckCircle2 className="h-2.5 w-2.5 text-primary" />
            2xx: {point.successCount}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />
            4xx: {point.clientErrCount}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <XCircle className="h-2.5 w-2.5 text-destructive" />
            5xx: {point.serverErrCount}
          </span>
        </div>
      </div>

      {/* Service Contribution (only shown in ALL view) */}
      {serviceFilter === "ALL" && (
        <div className="space-y-1 border-t border-border/50 pt-2 text-[10px] font-mono">
          <p className="font-semibold text-muted-foreground text-[9px] uppercase tracking-wider">
            Service Contribution
          </p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-muted-foreground">
            <span className="flex items-center justify-between">
              <span>Map & Tiles:</span>
              <span className="font-bold text-foreground">{point.mapHits}</span>
            </span>
            <span className="flex items-center justify-between">
              <span>Core API:</span>
              <span className="font-bold text-foreground">{point.coreHits}</span>
            </span>
            <span className="flex items-center justify-between">
              <span>Messaging:</span>
              <span className="font-bold text-foreground">{point.messagingHits}</span>
            </span>
            <span className="flex items-center justify-between">
              <span>Storage S3:</span>
              <span className="font-bold text-foreground">{point.storageHits}</span>
            </span>
          </div>
        </div>
      )}

      {/* Helper Footer */}
      <div className="border-t border-border/50 pt-1.5 flex items-center justify-between text-[9px] text-muted-foreground font-mono">
        <span className="text-primary font-medium flex items-center gap-1">
          💡 Klik batang bar untuk inspeksi telemetri
        </span>
        <ArrowUpRight className="h-3 w-3 text-primary animate-pulse" />
      </div>
    </div>
  );
}

export function RechartsCustomTooltip({
  active,
  payload,
  serviceFilter,
}: CustomTooltipProps & {
  serviceFilter: ServiceFilterType;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <FloatingRichTooltipContent
      point={point}
      serviceFilter={serviceFilter}
    />
  );
}
