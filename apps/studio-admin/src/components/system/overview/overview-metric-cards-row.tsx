

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
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-3 xl:grid-cols-5">
      {/* Card 1: MANAGED ASSETS (Hero Card on Mobile: col-span-2) */}
      <div className="col-span-2 sm:col-span-1 xl:col-span-1">
        <OverviewMetricCard
          eyebrow="MANAGED ASSETS"
          eyebrowBadge={
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-primary/15 text-primary border border-primary/20">
              <span className="size-1 rounded-full bg-primary animate-pulse" />
              FEATURED
            </span>
          }
          value={
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-bold">{loadingOrgs ? "..." : (totalAssets ?? "1,420")}</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20">
                OLT · ODP · OHC
              </span>
            </div>
          }
          helper="Tenants: All"
          secondaryStats={<span className="text-primary font-semibold">Uptime: 99.8%</span>}
          footer="Asset telemetry"
          icon={MapPin}
          accentClassName="text-primary"
          footerLinkHref="/observability/olt-poller"
          footerLinkLabel="OLT Telemetry"
          className="max-sm:border-primary/30 max-sm:bg-gradient-to-b max-sm:from-primary/10 max-sm:to-card"
        />
      </div>

      {/* Card 2: ACTIVE TENANTS */}
      <div className="col-span-1 sm:col-span-1 xl:col-span-1">
        <OverviewMetricCard
          eyebrow="ACTIVE TENANTS"
          value={
            <div className="flex items-center gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold">{loadingOrgs ? "..." : totalOrgs}</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/15 text-primary border border-primary/20">
                <span className="size-1 rounded-full bg-primary animate-pulse" />
                {loadingOrgs ? "" : `${activeOrgs} Active`}
              </span>
            </div>
          }
          helper={`Trialing: ${trialOrgs}`}
          secondaryStats={<span className="text-primary font-semibold">100% Cov</span>}
          footer="Platform coverage"
          icon={Building2}
          accentClassName="text-primary"
          footerLinkHref="/organizations"
          footerLinkLabel="Manage Orgs"
        />
      </div>

      {/* Card 3: GLOBAL USERS */}
      <div className="col-span-1 sm:col-span-1 xl:col-span-1">
        <OverviewMetricCard
          eyebrow="GLOBAL USERS"
          value={
            <div className="flex items-center gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold">{loadingUsers ? "..." : totalUsers}</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-sky-500/15 text-sky-400 border border-sky-500/20">
                <span className="size-1 rounded-full bg-sky-400" />
                {loadingUsers ? "" : `${activeUsers} Verified`}
              </span>
            </div>
          }
          helper={`Pending: ${loadingUsers ? "..." : pendingRequests}`}
          secondaryStats={<span className="text-muted-foreground/80">Admin/Ops</span>}
          footer="Identity administration"
          icon={Users}
          accentClassName="text-sky-400"
          footerLinkHref="/users"
          footerLinkLabel="Manage Users"
        />
      </div>

      {/* Card 4: SPATIAL THROUGHPUT */}
      <div className="col-span-1 sm:col-span-1 xl:col-span-1">
        <OverviewMetricCard
          eyebrow="SPATIAL THROUGHPUT"
          value={
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-sky-400">{loadingOrgs ? "..." : (spatialThroughput ?? "14.2k")}</span>
              <span className="text-[10px] font-mono text-muted-foreground/70">req/d</span>
            </div>
          }
          helper="Latency"
          secondaryStats={<span className="text-sky-400 font-mono font-semibold">~24ms avg</span>}
          footer="Map observability"
          icon={Globe}
          accentClassName="text-sky-400"
          footerLinkHref="/observability/spatial-map"
          footerLinkLabel="Map Gateway"
        />
      </div>

      {/* Card 5: OPERATIONAL TICKETS */}
      <div className="col-span-1 sm:col-span-1 xl:col-span-1">
        <OverviewMetricCard
          eyebrow="OPERATIONAL TICKETS"
          value={
            <div className="flex items-center gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold">{loadingTasks ? "..." : totalOpenTasks}</span>
              {urgentTasks > 0 ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/20 animate-pulse">
                  <span className="size-1 rounded-full bg-rose-400" />
                  {urgentTasks} URGENT
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  <span className="size-1 rounded-full bg-amber-400" />
                  {totalOpenTasks} Open
                </span>
              )}
            </div>
          }
          helper={`Resolved: ${loadingTasks ? "..." : resolvedTasksToday}`}
          secondaryStats={<span className="text-primary font-semibold">99.4% SLA</span>}
          footer="Operations & SLA"
          icon={ClipboardList}
          accentClassName={urgentTasks > 0 ? "text-rose-400" : "text-primary"}
          footerLinkHref="/tasks"
          footerLinkLabel="Manage Tickets"
        />
      </div>
    </div>
  );
}

