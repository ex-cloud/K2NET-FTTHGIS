import { useMemo, useState } from "react";
import { Card } from "@k2net/ui";
import { useRouter } from "@/lib/navigation-compat";
import { toast } from "sonner";
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
}

export function OverviewThroughputChart({ data }: OverviewThroughputChartProps) {
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

      const baseHits = d.hits;
      const mapHits = Math.round(baseHits * 0.42);
      const coreHits = Math.round(baseHits * 0.35);
      const messagingHits = Math.round(baseHits * 0.15);
      const storageHits = Math.max(1, baseHits - (mapHits + coreHits + messagingHits));

      let filteredHits = baseHits;
      if (serviceFilter === "MAP") filteredHits = mapHits;
      else if (serviceFilter === "API") filteredHits = coreHits;
      else if (serviceFilter === "MESSAGING") filteredHits = messagingHits;

      const successRate = 98.2 - (baseHits > 150 ? 1.2 : 0);
      const successCount = Math.max(1, Math.round((filteredHits * successRate) / 100));
      const clientErrCount = Math.round(filteredHits * 0.015);
      const serverErrCount = Math.max(0, filteredHits - successCount - clientErrCount);
      const latencyMs = Math.round(22 + (baseHits / 180) * 20);
      const peakRpm = Math.round(filteredHits * 3.8);

      return {
        hour: d.hour,
        timeRange: `${d.hour} - ${nextHour}`,
        totalHits: baseHits,
        filteredHits,
        successCount,
        clientErrCount,
        serverErrCount,
        successRate: parseFloat(successRate.toFixed(1)),
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
    <Card className="border-border bg-card p-5 md:p-6 transition-all">
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
