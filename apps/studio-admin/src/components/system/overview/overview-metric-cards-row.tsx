

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
    <div className="grid grid-cols-2 gap-2 sm:gap-3.5 lg:grid-cols-3 xl:grid-cols-5">
      {/* Card 1: Active Tenants — Top Highlight Hero Card on Mobile (col-span-2) */}
      <div className="col-span-2 sm:col-span-1 xl:col-span-1">
        <OverviewMetricCard
          eyebrow="Active Tenants"
          value={
            <span className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold">{loadingOrgs ? "..." : totalOrgs}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                {loadingOrgs ? "" : `${activeOrgs} Active`}
              </span>
            </span>
          }
          helper={<span>Trialing: {trialOrgs}</span>}
          footer="Platform coverage"
          icon={Building2}
          accentClassName="text-primary"
          footerLinkHref="/organizations"
          footerLinkLabel="Manage Orgs"
          className="border-primary/30 bg-gradient-to-b from-primary/5 via-card to-card"
        />
      </div>

      {/* Card 2: Global Users */}
      <div className="col-span-1 sm:col-span-1 xl:col-span-1">
        <OverviewMetricCard
          eyebrow="Global Users"
          value={
            <span className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-2xl font-bold">{loadingUsers ? "..." : totalUsers}</span>
              <span className="text-xs font-semibold text-primary/90">{loadingUsers ? "" : `${activeUsers} Verified`}</span>
            </span>
          }
          helper={<span>Pending Invites: {loadingUsers ? "..." : pendingRequests}</span>}
          footer="Identity administration"
          icon={Users}
          accentClassName="text-primary"
          footerLinkHref="/users"
          footerLinkLabel="Manage Users"
        />
      </div>

      {/* Card 3: Total Managed Assets */}
      <div className="col-span-1 sm:col-span-1 xl:col-span-1">
        <OverviewMetricCard
          eyebrow="Total Managed Assets"
          value={
            <span className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-2xl font-bold">{loadingOrgs ? "..." : (totalAssets ?? "1,420")}</span>
              <span className="text-[10px] sm:text-xs font-semibold text-primary/90">OLT · ODP · OHC</span>
            </span>
          }
          helper={<span>Network assets across all tenants</span>}
          footer="Asset telemetry"
          icon={MapPin}
          accentClassName="text-primary"
          footerLinkHref="/observability/olt-poller"
          footerLinkLabel="OLT Telemetry"
        />
      </div>

      {/* Card 4: Spatial API Throughput */}
      <div className="col-span-1 sm:col-span-1 xl:col-span-1">
        <OverviewMetricCard
          eyebrow="Spatial API Throughput"
          value={
            <span className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-2xl font-bold">{loadingOrgs ? "..." : (spatialThroughput ?? "14.2k")}</span>
              <span className="text-xs font-semibold text-sky-500">req/day</span>
            </span>
          }
          helper={<span>Map &amp; geocoding requests today</span>}
          footer="Map observability"
          icon={Globe}
          accentClassName="text-sky-500 dark:text-sky-400"
          footerLinkHref="/observability/spatial-map"
          footerLinkLabel="Map Gateway"
        />
      </div>

      {/* Card 5: Active Tickets */}
      <div className="col-span-1 sm:col-span-1 xl:col-span-1">
        <OverviewMetricCard
          eyebrow="Active Tickets"
          value={
            <span className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-2xl font-bold">{loadingTasks ? "..." : totalOpenTasks}</span>
              {urgentTasks > 0 ? (
                <span className="text-xs text-destructive font-bold flex items-center gap-1 animate-pulse">
                  <span>·</span> {urgentTasks} URGENT
                </span>
              ) : (
                <span className="text-xs font-medium text-muted-foreground">Open</span>
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
    </div>
  );
}

