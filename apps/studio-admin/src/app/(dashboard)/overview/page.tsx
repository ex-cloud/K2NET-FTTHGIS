"use client";

import { useMemo, useState } from "react";
import { Badge, Button, PageLayout } from "@k2net/ui";
import { RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { throughputData } from "@/lib/system-overview-data";
import { useSystemOverviewData } from "@/hooks/useSystemOverviewData";
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
  const [activeNode, setActiveNode] = useState<string | null>("db-postgres");

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

          {/* Page header */}
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20">
                  Admin Platform Control
                </Badge>
              </div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-foreground">
                System Overview <Sparkles className="h-5 w-5 animate-pulse text-primary" />
              </h1>
              <p className="text-xs text-muted-foreground">
                Global dashboard monitoring tenant health, authentication flow, spatial data services, and live gateway status.
              </p>
            </div>
            <Button
              onClick={() => data.loadData(true)}
              disabled={data.refreshing || data.loadingOrgs || data.loadingStats}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", data.refreshing && "animate-spin text-primary")} />
              Refresh Dashboard
            </Button>
          </div>

          {/* Status banner — only visible when there are issues */}
          {globalHealthState !== "operational" && globalHealthState !== "loading" && (
            <OverviewStatusBanner
              globalHealthState={globalHealthState}
              activeGatewaysCount={data.activeGatewaysCount}
              totalGatewaysCount={data.totalGatewaysCount}
            />
          )}

          {/* 4 Business KPI Cards */}
          <OverviewMetricCardsRow
            loadingOrgs={data.loadingOrgs}
            loadingUsers={data.loadingUsers}
            totalOrgs={data.totalOrgs}
            activeOrgs={data.activeOrgs}
            trialOrgs={data.trialOrgs}
            totalUsers={data.userStats.totalUsers}
            activeUsers={data.userStats.activeUsers}
            pendingRequests={data.userStats.pendingRequests}
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
      </PageLayout>
    </SystemOverviewWrapper>
  );
}
