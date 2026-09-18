import { useMemo, useState } from "react";
import { Button, PageLayout, ActionTooltip } from "@k2net/ui";
import { RefreshCw, Sparkles, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { throughputData } from "@/lib/system-overview-data";
import { useSystemOverviewData } from "@/hooks/useSystemOverviewData";
import { useTaskSummary } from "@/hooks/useTaskSummary";
import { useServiceNodes } from "@/components/system/overview/overview-service-nodes";
import {
  OverviewInfrastructureMap,
  OverviewMetricCardsRow,
  OverviewStatusBanner,
  OverviewThroughputChart,
  OverviewActivityFeed,
} from "@/components/system/overview";
import { SystemOverviewWrapper } from "@/components/page-guards/system-overview-wrapper";
import type { ServiceNode } from "@/components/system/overview/overview-types";

export default function SystemOverviewPage() {
  const data = useSystemOverviewData();
  const { summary: taskSummary, loading: loadingTasks, refresh: refreshTasks } = useTaskSummary();
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [activeTabFilter, setActiveTabFilter] = useState<"all" | "network" | "tickets">("all");

  const serviceNodes: ServiceNode[] = useServiceNodes({
    postgresStatus: data.systemHealth.postgresStatus,
    redisStatus: data.systemHealth.redisStatus,
    keycloakStatus: data.systemHealth.keycloakStatus,
    gateways: data.gateways,
    allGatewaysHealthy: data.allGatewaysHealthy,
    totalOrgs: data.totalOrgs,
    postgresConns: data.systemResources.postgresConns,
    redisCacheHit: data.systemResources.redisCacheHit,
    redisKeysCached: data.systemHealth.redisKeysCached,
  });

  const activeNodeData = useMemo(
    () => serviceNodes.find((n) => n.id === activeNode) ?? null,
    [activeNode, serviceNodes]
  );

  const globalHealthState = useMemo(() => {
    if (data.loadingStats) return "loading" as const;
    if (data.allGatewaysHealthy) return "operational" as const;
    if (data.activeGatewaysCount > 0) return "warning" as const;
    return "critical" as const;
  }, [data.loadingStats, data.allGatewaysHealthy, data.activeGatewaysCount]);

  const displayThroughput =
    data.systemHealth.throughput.length > 0 ? data.systemHealth.throughput : throughputData;

  return (
    <SystemOverviewWrapper>
      <PageLayout variant="dashboard">
        {/* pb on mobile = safe-area-inset-bottom + 88px dock height so the last
            OverviewActivityFeed card is not hidden behind the Floating Command Dock. */}
        <div className="space-y-4 pb-[calc(env(safe-area-inset-bottom)+88px)] sm:space-y-5 sm:pb-0">
          {/* Page Header (Reference Image 1 Alignment) */}
          <div className="flex flex-col gap-3 border-b border-border/80 pb-4">
            {/* Top Row: Dual Badges */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Radio className="size-3 sm:size-3.5 animate-pulse" /> FTTH GIS K2NET
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-muted/60 text-muted-foreground border border-border/50">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" /> Overview Monitoring
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <h1 className="flex items-center gap-2 text-xl sm:text-3xl font-bold tracking-tight text-foreground">
                System Infrastructure &amp; Gateway Telemetry
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse text-primary shrink-0" />
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Real-time spatial data services, authentication flows, OLT cluster nodes, and live gateway telemetry.
              </p>
            </div>

            {/* Status Control Bar + Unified "Sync Live" Button */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-[11px] sm:text-xs font-semibold text-primary">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                {globalHealthState === "operational" ? "ALL CLUSTERS OPERATIONAL" : "GATEWAY ISSUES DETECTED"}
              </div>

              <ActionTooltip label="Segarkan Dashboard" shortcut="R">
                <Button
                  onClick={() => {
                    data.loadData(true);
                    refreshTasks();
                  }}
                  disabled={data.refreshing || data.loadingOrgs || data.loadingStats || loadingTasks}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs font-medium gap-1.5 shrink-0"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", data.refreshing && "animate-spin text-primary")} />
                  <span>Sync Live</span>
                </Button>
              </ActionTooltip>
            </div>

            {/* Segmented Filter Tabs */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTabFilter("all")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
                  activeTabFilter === "all"
                    ? "bg-muted text-foreground border border-border/80 shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                Semua Metrik
              </button>
              <button
                type="button"
                onClick={() => setActiveTabFilter("network")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
                  activeTabFilter === "network"
                    ? "bg-muted text-foreground border border-border/80 shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                Aktivitas Jaringan
              </button>
              <button
                type="button"
                onClick={() => setActiveTabFilter("tickets")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
                  activeTabFilter === "tickets"
                    ? "bg-muted text-foreground border border-border/80 shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                Insiden &amp; Tiket
              </button>
            </div>
          </div>

          {/* Status banner — only visible when there are issues */}
          {globalHealthState !== "operational" && globalHealthState !== "loading" && (
            <OverviewStatusBanner
              globalHealthState={globalHealthState}
              activeGatewaysCount={data.activeGatewaysCount}
              totalGatewaysCount={data.totalGatewaysCount}
              gateways={data.gateways}
            />
          )}

          {/* 5 Business KPI Cards */}
          <OverviewMetricCardsRow
            loadingOrgs={data.loadingOrgs}
            loadingUsers={data.loadingUsers}
            totalOrgs={data.totalOrgs}
            activeOrgs={data.activeOrgs}
            trialOrgs={data.trialOrgs}
            totalUsers={data.userStats.totalUsers}
            activeUsers={data.userStats.activeUsers}
            pendingRequests={data.userStats.pendingRequests}
            loadingTasks={loadingTasks}
            totalOpenTasks={taskSummary?.totalOpen ?? 0}
            urgentTasks={taskSummary?.urgentCount ?? 0}
            resolvedTasksToday={taskSummary?.resolvedToday ?? 0}
          />

          {/* Interactive infrastructure map */}
          <OverviewInfrastructureMap
            serviceNodes={serviceNodes}
            activeNode={activeNode}
            onSelectNode={setActiveNode}
            activeNodeData={activeNodeData}
            gateways={data.gateways}
          />

          {/* Throughput chart */}
          <OverviewThroughputChart data={displayThroughput} />

          {/* Activity feed */}
          <OverviewActivityFeed loading={data.loadingOrgs} recentOrgs={data.recentOrgs} />
        </div>
      </PageLayout>
    </SystemOverviewWrapper>
  );
}
