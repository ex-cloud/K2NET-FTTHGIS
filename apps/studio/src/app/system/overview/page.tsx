"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { throughputData } from "@/lib/system-overview-data";
import { useSystemOverviewData } from "@/hooks/useSystemOverviewData";
import { useServiceNodes } from "@/components/system/overview/overview-service-nodes";
import {
  OverviewActivityFeed,
  OverviewDevopsSection,
  OverviewInfrastructureMap,
  OverviewMetricCardsRow,
  OverviewStatusBanner,
  OverviewThroughputChart,
} from "@/components/system/overview";
import { SystemOverviewWrapper } from "@/components/page-guards/system-overview-wrapper";
import type { ServiceNode } from "@/components/system/overview/overview-types";

const FRONTEND_GIT_BRANCH = process.env.NEXT_PUBLIC_GIT_BRANCH || "main";
const FRONTEND_GIT_COMMIT = process.env.NEXT_PUBLIC_GIT_COMMIT || "unknown";
const FRONTEND_GIT_COMMIT_SHORT =
  FRONTEND_GIT_COMMIT.length > 7 ? FRONTEND_GIT_COMMIT.substring(0, 7) : FRONTEND_GIT_COMMIT;

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
      <div className="flex h-full flex-1 flex-col overflow-y-auto bg-background px-8 pt-16">
        <div className="mx-auto w-full max-w-[1600px] space-y-8 pb-20">

          {/* Page header */}
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-emerald-500/20">
                  Admin Platform Control
                </Badge>
              </div>
              <h1 className="flex items-center gap-3 text-3xl font-light tracking-tight text-zinc-100">
                System Overview <Sparkles className="h-5 w-5 animate-pulse text-primary" />
              </h1>
              <p className="text-xs text-zinc-500">
                Global dashboard monitoring tenant health, authentication flow, spatial data services, and live gateway status.
              </p>
            </div>
            <Button
              onClick={() => data.loadData(true)}
              disabled={data.refreshing || data.loadingOrgs || data.loadingStats}
              variant="outline"
              className="gap-2 border-white/10 bg-zinc-950/80 text-xs text-zinc-300 transition-all hover:border-primary/30 hover:bg-zinc-900 hover:text-zinc-100"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", data.refreshing && "animate-spin text-primary")} />
              Refresh Dashboard
            </Button>
          </div>

          {/* Status banner */}
          <OverviewStatusBanner
            globalHealthState={globalHealthState}
            activeGatewaysCount={data.activeGatewaysCount}
            totalGatewaysCount={data.totalGatewaysCount}
          />

          {/* 4 KPI metric cards */}
          <OverviewMetricCardsRow
            loadingOrgs={data.loadingOrgs}
            loadingUsers={data.loadingUsers}
            loadingGateways={data.loadingGateways}
            loadingHealth={data.loadingHealth}
            totalOrgs={data.totalOrgs}
            activeOrgs={data.activeOrgs}
            trialOrgs={data.trialOrgs}
            totalUsers={data.userStats.totalUsers}
            activeUsers={data.userStats.activeUsers}
            pendingRequests={data.userStats.pendingRequests}
            activeGatewaysCount={data.activeGatewaysCount}
            totalGatewaysCount={data.totalGatewaysCount}
            allGatewaysHealthy={data.allGatewaysHealthy}
            avgLatency={data.avgLatency}
            cpu={data.systemResources.cpu}
            memory={data.systemResources.memory}
            memoryUsed={data.systemResources.memoryUsed}
          />

          {/* DevOps section */}
          <OverviewDevopsSection
            devopsStats={data.devopsStats}
            githubIntegrationStatus={data.githubIntegrationStatus}
            postgresStatus={data.systemHealth.postgresStatus}
            redisStatus={data.systemHealth.redisStatus}
            postgresConns={data.systemResources.postgresConns}
            redisCacheHit={data.systemResources.redisCacheHit}
            globalHealthState={globalHealthState}
            frontendGitBranch={FRONTEND_GIT_BRANCH}
            frontendGitCommit={FRONTEND_GIT_COMMIT}
            frontendGitCommitShort={FRONTEND_GIT_COMMIT_SHORT}
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
      </div>
    </SystemOverviewWrapper>
  );
}
