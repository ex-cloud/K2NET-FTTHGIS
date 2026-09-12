import { useState, useCallback, useEffect } from "react";
import { useComputeObservability } from "@/hooks/useComputeObservability";
import { Cpu, HardDrive, MemoryStick, RefreshCw, Server } from "lucide-react";
import { SystemHealthWrapper } from "@/components/page-guards/system-health-wrapper";
import { Button, PageLayout, ActionTooltip } from "@k2net/ui";
import {
  getSystemHealthMetrics,
  type SystemHealthData,
} from "@/lib/actions/health";
import {
  MetricCard,
  LoadAvgCard,
  formatBytes,
  pct,
} from "@/components/observability/compute-metric-cards";
import {
  ComputeChartsSection,
  DisasterRecoverySection,
} from "@/components/observability/compute-charts";
import {
  ComputeServicesSection,
  ComputeIntegritySection,
} from "@/components/observability/compute-services-section";

function ComputeHeader({
  countdown,
  lastUpdatedStr,
  onRefresh,
  loading,
}: {
  countdown: number;
  lastUpdatedStr: string;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          Compute & Host
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time server metrics, microservice status, and runtime integrity.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Auto-refresh dalam {countdown}s · Update: {lastUpdatedStr}
        </span>
        <ActionTooltip label="Segarkan Host Metrics" shortcut="R">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            Refresh
          </Button>
        </ActionTooltip>
      </div>
    </div>
  );
}

function ComputeKpiGrid({
  nodeData,
  cpuPct,
  memPct,
  diskPct,
  loadAvg,
  cores,
}: {
  nodeData: SystemHealthData | null;
  cpuPct: number;
  memPct: number;
  diskPct: number;
  loadAvg: { load1: number; load5: number; load15: number };
  cores?: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard icon={Cpu} label="CPU Usage" value={`${cpuPct}%`}
        sub="avg across all cores" percent={cpuPct} color="emerald" />
      <MetricCard icon={MemoryStick} label="RAM Usage"
        value={formatBytes(nodeData?.memUsedBytes ?? 0)}
        sub={`Total: ${formatBytes(nodeData?.memTotalBytes ?? 0)}`}
        percent={memPct} color="sky" />
      <MetricCard icon={HardDrive} label="Disk Usage"
        value={formatBytes(nodeData?.diskUsedBytes ?? 0)}
        sub={`Total: ${formatBytes(nodeData?.diskTotalBytes ?? 0)}`}
        percent={diskPct} color="violet" />
      <LoadAvgCard
        load1={loadAvg.load1}
        load5={loadAvg.load5}
        load15={loadAvg.load15}
        cores={cores}
      />
    </div>
  );
}

export default function ComputeHostPage() {
  const {
    charts,
    loadAvg,
    services,
    devOpsStats,
    loading: computeLoading,
    lastUpdated,
    refresh,
  } = useComputeObservability(30_000);

  const [nodeData, setNodeData] = useState<SystemHealthData | null>(null);
  const [nodeLoading, setNodeLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);

  const fetchNode = useCallback(async () => {
    setNodeLoading(true);
    try {
      const m = await getSystemHealthMetrics();
      setNodeData(m);
    } catch {
      // silent
    } finally {
      setNodeLoading(false);
    }
  }, []);

  useEffect(() => { fetchNode(); }, [fetchNode]);
  useEffect(() => {
    const iv = setInterval(fetchNode, 30_000);
    return () => clearInterval(iv);
  }, [fetchNode]);
  useEffect(() => {
    const t = setInterval(() => setCountdown(c => c <= 1 ? 30 : c - 1), 1000);
    return () => clearInterval(t);
  }, []);

  const cpuPct = nodeData ? Math.round(nodeData.cpu) : 0;
  const memPct = nodeData ? pct(nodeData.memUsedBytes, nodeData.memTotalBytes) : 0;
  const diskPct = nodeData ? pct(nodeData.diskUsedBytes, nodeData.diskTotalBytes) : 0;
  const loading = computeLoading || nodeLoading;

  const migration = devOpsStats?.lastMigration ?? { version: "—", success: false, installedOn: "—" };
  const backup = devOpsStats?.lastBackup ?? { status: "UNKNOWN" };
  const compute = devOpsStats?.compute ?? { heapUsedMb: 0, heapMaxMb: 0, usedMemoryMb: 0, maxMemoryMb: 0, nonHeapUsedMb: 0 };
  const cores = (compute?.cpuCores ?? 0) > 0 ? compute?.cpuCores : undefined;

  const lastUpdatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  const handleRefresh = () => {
    refresh();
    fetchNode();
  };

  return (
    <SystemHealthWrapper>
      <PageLayout variant="workspace" spaceY="space-y-6">
        <ComputeHeader
          countdown={countdown}
          lastUpdatedStr={lastUpdatedStr}
          onRefresh={handleRefresh}
          loading={loading}
        />

        <ComputeKpiGrid
          nodeData={nodeData}
          cpuPct={cpuPct}
          memPct={memPct}
          diskPct={diskPct}
          loadAvg={loadAvg}
          cores={cores}
        />

        <ComputeServicesSection services={services} />

        <ComputeIntegritySection
          compute={compute}
          migration={migration}
          backup={backup}
        />

        <ComputeChartsSection charts={charts} />

        <DisasterRecoverySection backup={backup} />
      </PageLayout>
    </SystemHealthWrapper>
  );
}
