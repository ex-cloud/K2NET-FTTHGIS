"use client";

import { Activity, Building2, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { OverviewMetricCard } from "./overview-metric-card";

interface OverviewMetricCardsRowProps {
  loadingOrgs: boolean;
  loadingUsers: boolean;
  loadingGateways: boolean;
  loadingHealth: boolean;
  totalOrgs: number;
  activeOrgs: number;
  trialOrgs: number;
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
  activeGatewaysCount: number;
  totalGatewaysCount: number;
  allGatewaysHealthy: boolean;
  avgLatency: string;
  cpu: number;
  memory: number;
  memoryUsed: string;
}

export function OverviewMetricCardsRow({
  loadingOrgs,
  loadingUsers,
  loadingGateways,
  loadingHealth,
  totalOrgs,
  activeOrgs,
  trialOrgs,
  totalUsers,
  activeUsers,
  pendingRequests,
  activeGatewaysCount,
  totalGatewaysCount,
  allGatewaysHealthy,
  avgLatency,
  cpu,
  memory,
  memoryUsed,
}: OverviewMetricCardsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        eyebrow="Active Gateways"
        value={
          <span className="flex items-baseline gap-2">
            {loadingGateways ? "..." : `${activeGatewaysCount} / ${totalGatewaysCount}`}
            <span className={cn("text-xs font-medium text-primary", !allGatewaysHealthy && "text-amber-500")}>
              {allGatewaysHealthy ? "Healthy" : "Degraded"}
            </span>
          </span>
        }
        helper={<span>Avg Latency: {loadingGateways ? "..." : avgLatency}</span>}
        footer="Service routing"
        icon={Zap}
        accentClassName="text-primary"
        footerLinkHref="/gateways/overview"
        footerLinkLabel="Gateways Panel"
      />

      <OverviewMetricCard
        eyebrow="CPU / RAM Load"
        value={
          <span className="flex items-baseline gap-2">
            {loadingHealth ? "..." : `${cpu}%`}
            <span className="text-xs text-sky-400">{loadingHealth ? "" : "CPU"}</span>
            {loadingHealth ? null : <span className="text-xs text-sky-400">/ {memory}% RAM</span>}
          </span>
        }
        helper={<span>RAM Used: {loadingHealth ? "..." : memoryUsed}</span>}
        footer="Infrastructure health"
        icon={Activity}
        accentClassName="text-sky-400"
        footerLinkHref="/health"
        footerLinkLabel="System Stats"
      />
    </div>
  );
}
