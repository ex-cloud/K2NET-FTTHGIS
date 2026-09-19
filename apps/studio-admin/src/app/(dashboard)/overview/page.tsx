import { useMemo } from "react";
import { PageLayout } from "@k2net/ui";
import { throughputData } from "@/lib/system-overview-data";
import { useSystemOverviewData } from "@/hooks/useSystemOverviewData";
import { useTaskSummary } from "@/hooks/useTaskSummary";
import {
  OverviewMetricCardsRow,
  OverviewStatusBanner,
  OverviewThroughputChart,
  OverviewActivityFeed,
} from "@/components/system/overview";
import { SystemOverviewWrapper } from "@/components/page-guards/system-overview-wrapper";

export default function SystemOverviewPage() {
  const data = useSystemOverviewData();
  const { summary: taskSummary, loading: loadingTasks } = useTaskSummary();

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

          {/* Combined System Throughput & Gateway Load */}
          <OverviewThroughputChart data={displayThroughput} />

          {/* Activity feed */}
          <OverviewActivityFeed loading={data.loadingOrgs} recentOrgs={data.recentOrgs} />
        </div>
      </PageLayout>
    </SystemOverviewWrapper>
  );
}
