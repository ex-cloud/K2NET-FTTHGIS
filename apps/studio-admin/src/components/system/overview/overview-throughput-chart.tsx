import { useMemo, useState } from "react";
import { Card } from "@k2net/ui";
import { useRouter } from "@/lib/navigation-compat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  ThroughputDataPoint,
  ServiceFilterType,
  ChartViewMode,
  EnrichedThroughputPoint,
} from "./overview-throughput-types";
import { ThroughputToolbar } from "./ThroughputToolbar";
import { ThroughputChartRenderer } from "./ThroughputChartRenderer";
import { ThroughputKpiFooter } from "./ThroughputKpiFooter";

export type { ThroughputDataPoint, ServiceFilterType, ChartViewMode };

interface OverviewThroughputChartProps {
  data: ThroughputDataPoint[];
  className?: string;
}

export function OverviewThroughputChart({ data, className }: OverviewThroughputChartProps) {
  const router = useRouter();
  const [serviceFilter, setServiceFilter] = useState<ServiceFilterType>("ALL");
  const [chartMode, setChartMode] = useState<ChartViewMode>("bars");

  // Transform raw data points into richly enriched points
  const enrichedData: EnrichedThroughputPoint[] = useMemo(() => {
    return data.map((d, index) => {
      const nextHour =
        index < data.length - 1
          ? data[index + 1].hour
          : `${(parseInt(d.hour.split(":")[0], 10) + 1) % 24}:00`.padStart(5, "0");

      const baseHits = d.hits ?? 0;
      const mapHits = typeof d.mapHits === "number" ? d.mapHits : 0;
      const coreHits = typeof d.coreHits === "number" ? d.coreHits : 0;
      const messagingHits = typeof d.messagingHits === "number" ? d.messagingHits : 0;
      const storageHits = typeof d.storageHits === "number" ? d.storageHits : 0;

      let filteredHits = baseHits;
      if (serviceFilter === "MAP") filteredHits = mapHits;
      else if (serviceFilter === "API") filteredHits = coreHits;
      else if (serviceFilter === "MESSAGING") filteredHits = messagingHits;

      // Real status counts from backend
      const successCount = typeof d.successCount === "number"
        ? (serviceFilter === "ALL" ? d.successCount : (baseHits > 0 ? Math.round((filteredHits / baseHits) * d.successCount) : 0))
        : filteredHits;

      const clientErrCount = typeof d.clientErrCount === "number"
        ? (serviceFilter === "ALL" ? d.clientErrCount : (baseHits > 0 ? Math.round((filteredHits / baseHits) * d.clientErrCount) : 0))
        : 0;

      const serverErrCount = typeof d.serverErrCount === "number"
        ? (serviceFilter === "ALL" ? d.serverErrCount : (baseHits > 0 ? Math.round((filteredHits / baseHits) * d.serverErrCount) : 0))
        : 0;

      const successRate = filteredHits > 0
        ? Math.min(100, Math.max(0, parseFloat(((successCount / filteredHits) * 100).toFixed(1))))
        : 100.0;

      const latencyMs = typeof d.avgLatency === "number" ? d.avgLatency : 0;
      const peakRpm = filteredHits > 0 ? Math.max(1, Math.round(filteredHits / 60)) : 0;

      return {
        hour: d.hour,
        timeRange: `${d.hour} - ${nextHour}`,
        totalHits: baseHits,
        filteredHits,
        successCount,
        clientErrCount,
        serverErrCount,
        successRate,
        latencyMs,
        peakRpm,
        mapHits,
        coreHits,
        messagingHits,
        storageHits,
      };
    });
  }, [data, serviceFilter]);

  const maxHits = useMemo(() => {
    return Math.max(...enrichedData.map((d) => d.filteredHits), 1);
  }, [enrichedData]);

  const total24hRequests = useMemo(() => {
    return enrichedData.reduce((acc, curr) => acc + curr.filteredHits, 0);
  }, [enrichedData]);

  const avgLatency24h = useMemo(() => {
    if (enrichedData.length === 0) return 24;
    return Math.round(
      enrichedData.reduce((acc, curr) => acc + curr.latencyMs, 0) / enrichedData.length
    );
  }, [enrichedData]);

  const handleDrilldown = (point: EnrichedThroughputPoint) => {
    let targetPath = "/observability/api-gateway";
    let targetLabel = "API Gateway Observability";

    if (serviceFilter === "MAP") {
      targetPath = "/observability/spatial-map";
      targetLabel = "Spatial Map Observability";
    } else if (serviceFilter === "MESSAGING") {
      targetPath = "/observability/messaging";
      targetLabel = "Messaging & Notification Telemetry";
    } else if (serviceFilter === "API") {
      targetPath = "/observability/database";
      targetLabel = "Core API & Database Observability";
    }

    toast.info(`Membuka ${targetLabel} (${point.timeRange})...`);
    router.push(targetPath);
  };

  return (
    <Card className={cn("border-border bg-card p-5 md:p-6 transition-all", className)}>
      <ThroughputToolbar
        serviceFilter={serviceFilter}
        setServiceFilter={setServiceFilter}
        chartMode={chartMode}
        setChartMode={setChartMode}
      />

      <ThroughputChartRenderer
        enrichedData={enrichedData}
        chartMode={chartMode}
        serviceFilter={serviceFilter}
        onDrilldown={handleDrilldown}
      />

      <ThroughputKpiFooter
        total24hRequests={total24hRequests}
        maxHits={maxHits}
        avgLatency24h={avgLatency24h}
        onNavigateObservability={() => router.push("/observability/api-gateway")}
      />
    </Card>
  );
}
