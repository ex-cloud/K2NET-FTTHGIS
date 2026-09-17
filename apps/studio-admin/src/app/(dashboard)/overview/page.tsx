

import { useMemo, useState } from "react";
import { Badge, Button, PageLayout, ActionTooltip } from "@k2net/ui";
import { RefreshCw, Sparkles } from "lucide-react";
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
        <div className="space-y-4 sm:space-y-6">
          {/* Page header */}
          <div className="flex flex-col justify-between gap-3 border-b border-border pb-4 sm:pb-5 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary hover:bg-primary/20">
                  Admin Platform Control
                </Badge>
              </div>
              <div className="flex items-center justify-between sm:block">
                <h1 className="flex items-center gap-2 sm:gap-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  System Overview <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse text-primary" />
                </h1>
                <div className="sm:hidden">
                  <Button
                    onClick={() => {
                      data.loadData(true);
                      refreshTasks();
                    }}
                    disabled={data.refreshing || data.loadingOrgs || data.loadingStats || loadingTasks}
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", data.refreshing && "animate-spin text-primary")} />
                    <span className="sr-only">Refresh</span>
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-none">
                Global dashboard monitoring tenant health, authentication flow, spatial data services, and live gateway status.
              </p>
            </div>
            <div className="hidden sm:block">
              <ActionTooltip label="Segarkan Dashboard" shortcut="R">
                <Button
                  onClick={() => {
                    data.loadData(true);
                    refreshTasks();
                  }}
                  disabled={data.refreshing || data.loadingOrgs || data.loadingStats || loadingTasks}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", data.refreshing && "animate-spin text-primary")} />
                  Refresh Dashboard
                </Button>
              </ActionTooltip>
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
