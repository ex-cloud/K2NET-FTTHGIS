

import { Building2, Users, MapPin, Globe, ClipboardList } from "lucide-react";
import { OverviewMetricCard } from "./overview-metric-card";

interface OverviewMetricCardsRowProps {
  loadingOrgs: boolean;
  loadingUsers: boolean;
  totalOrgs: number;
  activeOrgs: number;
  trialOrgs: number;
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
  totalAssets?: number | string;
  spatialThroughput?: number | string;
  loadingTasks?: boolean;
  totalOpenTasks?: number;
  urgentTasks?: number;
  resolvedTasksToday?: number;
}

export function OverviewMetricCardsRow({
  loadingOrgs,
  loadingUsers,
  totalOrgs,
  activeOrgs,
  trialOrgs,
  totalUsers,
  activeUsers,
  pendingRequests,
  totalAssets,
  spatialThroughput,
  loadingTasks = false,
  totalOpenTasks = 0,
  urgentTasks = 0,
  resolvedTasksToday = 0,
}: OverviewMetricCardsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <OverviewMetricCard
        eyebrow="Active Tenants"
        value={
          <span className="flex items-baseline gap-2">
            {loadingOrgs ? "..." : totalOrgs}
            <span className="text-xs text-primary">{loadingOrgs ? "" : `${activeOrgs} Active`}</span>
          </span>
        }
        helper={<span>Trialing: {trialOrgs}</span>}
        footer="Platform coverage"
        icon={Building2}
        accentClassName="text-primary"
        footerLinkHref="/organizations"
        footerLinkLabel="Manage Orgs"
      />

      <OverviewMetricCard
        eyebrow="Global Users"
        value={
          <span className="flex items-baseline gap-2">
            {loadingUsers ? "..." : totalUsers}
            <span className="text-xs text-primary">{loadingUsers ? "" : `${activeUsers} Verified`}</span>
          </span>
        }
        helper={<span>Pending Invites: {loadingUsers ? "..." : pendingRequests}</span>}
        footer="Identity administration"
        icon={Users}
        accentClassName="text-primary"
        footerLinkHref="/users"
        footerLinkLabel="Manage Users"
      />

      <OverviewMetricCard
        eyebrow="Total Managed Assets"
        value={
          <span className="flex items-baseline gap-2">
            {loadingOrgs ? "..." : (totalAssets ?? "1,420")}
            <span className="text-xs text-primary">OLT · ODP · OHC</span>
          </span>
        }
        helper={<span>Network assets across all tenants</span>}
        footer="Asset telemetry"
        icon={MapPin}
        accentClassName="text-primary"
        footerLinkHref="/observability/olt-poller"
        footerLinkLabel="OLT Telemetry"
      />

      <OverviewMetricCard
        eyebrow="Spatial API Throughput"
        value={
          <span className="flex items-baseline gap-2">
            {loadingOrgs ? "..." : (spatialThroughput ?? "14.2k")}
            <span className="text-xs text-sky-500">req/day</span>
          </span>
        }
        helper={<span>Map &amp; geocoding requests today</span>}
        footer="Map observability"
        icon={Globe}
        accentClassName="text-sky-500 dark:text-sky-400"
        footerLinkHref="/observability/spatial-map"
        footerLinkLabel="Map Gateway"
      />

      <OverviewMetricCard
        eyebrow="Active Tickets"
        value={
          <span className="flex items-baseline gap-2">
            {loadingTasks ? "..." : totalOpenTasks}
            {urgentTasks > 0 ? (
              <span className="text-xs text-destructive font-bold flex items-center gap-1 animate-pulse">
                <span>·</span> {urgentTasks} URGENT
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Open</span>
            )}
          </span>
        }
        helper={<span>Resolved Today: {loadingTasks ? "..." : resolvedTasksToday}</span>}
        footer="Operations & SLA"
        icon={ClipboardList}
        accentClassName={urgentTasks > 0 ? "text-destructive" : "text-primary"}
        footerLinkHref="/tasks"
        footerLinkLabel="Manage Tasks"
      />
    </div>
  );
}

