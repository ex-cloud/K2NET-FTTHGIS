import { Building2, Users, MapPin, Globe, ClipboardList } from "lucide-react";
import { OverviewMetricCard } from "./overview-metric-card";
import { OverviewMetricCardsSkeleton } from "./skeletons";

interface OverviewMetricCardsRowProps {
  loadingOrgs: boolean;
  loadingUsers: boolean;
  totalOrgs: number;
  activeOrgs: number;
  trialOrgs: number;
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
  totalAssets?: number;
  spatialThroughput?: number;
  spatialLatency?: number | string;
  uptimePercentage?: string;
  slaPercentage?: string;
  loadingTasks?: boolean;
  totalOpenTasks?: number;
  urgentTasks?: number;
  resolvedTasksToday?: number;
}

function ManagedAssetsValue({ loading, totalAssets }: { loading: boolean; totalAssets: number }) {
  if (loading && totalAssets === 0) {
    return <div className="h-7 w-20 rounded bg-muted/60 animate-pulse my-0.5" />;
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl sm:text-3xl font-bold">{totalAssets.toLocaleString()}</span>
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted/40 text-foreground/85 border border-border/60">
        OLT · ODP · OHC
      </span>
    </div>
  );
}

function ActiveTenantsValue({ loading, totalOrgs, activeOrgs }: { loading: boolean; totalOrgs: number; activeOrgs: number }) {
  if (loading && totalOrgs === 0) {
    return <div className="h-7 w-16 rounded bg-muted/60 animate-pulse my-0.5" />;
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-2xl sm:text-3xl font-bold">{totalOrgs}</span>
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/15 text-primary border border-primary/20">
        <span className="size-1 rounded-full bg-primary animate-pulse" />
        {`${activeOrgs} Active`}
      </span>
    </div>
  );
}

function GlobalUsersValue({ loading, totalUsers, activeUsers }: { loading: boolean; totalUsers: number; activeUsers: number }) {
  if (loading && totalUsers === 0) {
    return <div className="h-7 w-16 rounded bg-muted/60 animate-pulse my-0.5" />;
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-2xl sm:text-3xl font-bold">{totalUsers}</span>
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-sky-500/15 text-sky-400 border border-sky-500/20">
        <span className="size-1 rounded-full bg-sky-400" />
        {`${activeUsers} Verified`}
      </span>
    </div>
  );
}

function OperationalTicketsValue({
  loading,
  totalOpenTasks,
  urgentTasks,
}: {
  loading: boolean;
  totalOpenTasks: number;
  urgentTasks: number;
}) {
  if (loading && totalOpenTasks === 0) {
    return <div className="h-7 w-14 rounded bg-muted/60 animate-pulse my-0.5" />;
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-2xl sm:text-3xl font-bold">{totalOpenTasks}</span>
      {urgentTasks > 0 ? (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/20">
          <span className="size-1 rounded-full bg-rose-400 animate-ping" />
          {urgentTasks} Urgent
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
          <span className="size-1 rounded-full bg-amber-400" />
          {totalOpenTasks} Open
        </span>
      )}
    </div>
  );
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
  totalAssets = 0,
  spatialThroughput = 0,
  spatialLatency = 24,
  uptimePercentage = "100%",
  slaPercentage = "100% SLA",
  loadingTasks = false,
  totalOpenTasks = 0,
  urgentTasks = 0,
  resolvedTasksToday = 0,
}: OverviewMetricCardsRowProps) {
  // If initial cold start, show full skeleton grid
  if (loadingOrgs && loadingUsers && totalOrgs === 0 && totalUsers === 0) {
    return <OverviewMetricCardsSkeleton />;
  }

  const formattedSpatialThroughput =
    typeof spatialThroughput === "number"
      ? spatialThroughput >= 1000
        ? `${(spatialThroughput / 1000).toFixed(1)}k`
        : spatialThroughput.toLocaleString()
      : spatialThroughput;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-3 xl:grid-cols-5">
      {/* Card 1: MANAGED ASSETS (Hero Card on Mobile: col-span-2) */}
      <div className="col-span-2 sm:col-span-1 xl:col-span-1">
        <OverviewMetricCard
          eyebrow="MANAGED ASSETS"
          eyebrowBadge={
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium bg-muted/60 text-muted-foreground border border-border/60">
              <span className="size-1 rounded-full bg-primary animate-pulse" />
              FEATURED
            </span>
          }
          value={<ManagedAssetsValue loading={loadingOrgs} totalAssets={totalAssets} />}
          helper="Tenants: All"
          secondaryStats={<span className="font-mono text-muted-foreground font-medium">Uptime: <span className="text-primary font-semibold">{uptimePercentage}</span></span>}
          footer="Asset telemetry"
          icon={MapPin}
          accentClassName="text-foreground"
          footerLinkHref="/observability/olt-poller"
          footerLinkLabel="OLT Telemetry"
          className="max-sm:bg-gradient-to-b max-sm:from-muted/50 max-sm:via-card max-sm:to-card"
        />
      </div>

      {/* Card 2: ACTIVE TENANTS */}
      <div className="col-span-1 sm:col-span-1 xl:col-span-1">
        <OverviewMetricCard
          eyebrow="ACTIVE TENANTS"
          value={<ActiveTenantsValue loading={loadingOrgs} totalOrgs={totalOrgs} activeOrgs={activeOrgs} />}
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
          value={<GlobalUsersValue loading={loadingUsers} totalUsers={totalUsers} activeUsers={activeUsers} />}
          helper={`Pending: ${pendingRequests}`}
          secondaryStats={<span className="font-mono text-muted-foreground">Admin/Ops</span>}
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
            loadingOrgs && spatialThroughput === 0 ? (
              <div className="h-7 w-16 rounded bg-muted/60 animate-pulse my-0.5" />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-bold">{formattedSpatialThroughput}</span>
                <span className="text-xs text-muted-foreground font-mono">req/d</span>
              </div>
            )
          }
          helper="Latency"
          secondaryStats={<span className="font-mono text-sky-400 font-medium">~{spatialLatency}ms avg</span>}
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
            <OperationalTicketsValue
              loading={loadingTasks}
              totalOpenTasks={totalOpenTasks}
              urgentTasks={urgentTasks}
            />
          }
          helper={`Resolved: ${resolvedTasksToday}`}
          secondaryStats={<span className="font-mono text-primary font-semibold">{slaPercentage}</span>}
          footer="Operations & SLA"
          icon={ClipboardList}
          accentClassName="text-amber-400"
          footerLinkHref="/tasks"
          footerLinkLabel="Manage Tickets"
        />
      </div>
    </div>
  );
}
