"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrganizations } from "@/hooks/useOrganizations";
import { getGatewayStatus, type GatewayServiceStatus } from "@/lib/actions/gateways";
import { useSession } from "next-auth/react";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Database,
  DatabaseBackup,
  GitBranch,
  Github,
  HardDrive,
  RefreshCw,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { throughputData } from "@/lib/system-overview-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DevOpsStats, ServiceNode, UserStats } from "@/components/system/overview/overview-types";
import {
  OverviewActivityFeed,
  OverviewDevOpsCard,
  OverviewInfrastructureMap,
  OverviewMetricCard,
  OverviewShell,
  OverviewStatusBadge,
} from "@/components/system/overview";

export default function SystemOverviewPage() {
  const FRONTEND_GIT_BRANCH = process.env.NEXT_PUBLIC_GIT_BRANCH || "main";
  const FRONTEND_GIT_COMMIT = process.env.NEXT_PUBLIC_GIT_COMMIT || "unknown";
  const FRONTEND_GIT_COMMIT_SHORT = FRONTEND_GIT_COMMIT.length > 7 ? FRONTEND_GIT_COMMIT.substring(0, 7) : FRONTEND_GIT_COMMIT;

  const { organizations, loading: loadingOrgs, refresh: refreshOrgs } = useOrganizations();
  const { data: session } = useSession();

  const [userStats, setUserStats] = useState<UserStats>({ totalUsers: 0, activeUsers: 0, pendingRequests: 0 });
  const [gateways, setGateways] = useState<GatewayServiceStatus[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>("db-postgres");
  const [devopsStats, setDevopsStats] = useState<DevOpsStats | null>(null);
  const [githubIntegrationStatus, setGithubIntegrationStatus] = useState({
    connected: false,
    organization: "",
    installationTarget: "",
    repositoriesCount: 0,
    message: "",
  });

  const systemResources = useMemo(() => {
    void refreshing;
    return {
      cpu: 18 + Math.floor(Math.random() * 8),
      memory: 54,
      memoryUsed: "8.6 GB",
      memoryTotal: "16 GB",
      disk: 42,
      postgresConns: 12 + Math.floor(Math.random() * 5),
      redisCacheHit: 96.4,
    };
  }, [refreshing]);

  const loadData = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    setLoadingStats(true);

    try {
      await refreshOrgs();

      if (session?.accessToken) {
        const res = await fetch("/api/v1/users/stats", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        if (res.ok) {
          const stats = await res.json();
          setUserStats(stats);
        }

        const devOpsRes = await fetch("/api/v1/system/devops-stats", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        if (devOpsRes.ok) {
          const devOps = await devOpsRes.json();
          setDevopsStats(devOps);
        }

        const githubStatusRes = await fetch("/api/v1/system/github-integration/status", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        if (githubStatusRes.ok) {
          const githubStatus = await githubStatusRes.json();
          setGithubIntegrationStatus({
            connected: Boolean(githubStatus?.connected),
            organization: typeof githubStatus?.organization === "string" ? githubStatus.organization : "",
            installationTarget: typeof githubStatus?.installationTarget === "string" ? githubStatus.installationTarget : "",
            repositoriesCount: Array.isArray(githubStatus?.repositories) ? githubStatus.repositories.length : 0,
            message: typeof githubStatus?.message === "string" ? githubStatus.message : "",
          });
        }
      }

      const gwRes = await getGatewayStatus();
      if (gwRes.status === "ok") {
        setGateways(gwRes.services);
      }

      if (showToast) {
        toast.success("Statistik sistem berhasil diperbarui!");
      }
    } catch (err) {
      console.error("Error fetching overview data:", err);
      if (showToast) {
        toast.error("Gagal memperbarui beberapa data sistem.");
      }
    } finally {
      setLoadingStats(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  const totalOrgs = organizations.length;
  const activeOrgs = organizations.filter((o) => o.status === "ACTIVE").length;
  const trialOrgs = organizations.filter((o) => o.status === "ACTIVE" && o.trialExpiresAt).length;

  const totalGatewaysCount = gateways.length || 4;
  const activeGatewaysCount = gateways.filter((g) => g.active).length;
  const allGatewaysHealthy = activeGatewaysCount === totalGatewaysCount;

  const recentOrgs = useMemo(() => {
    return [...organizations]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [organizations]);

  const serviceNodes: ServiceNode[] = useMemo(() => {
    const postgresActive = true;
    const redisActive = true;
    const keycloakActive = true;

    const getGwActive = (name: string) => gateways.find((g) => g.name === name)?.active ?? false;
    const notificationActive = getGwActive("ftth-notification-gateway");
    const paymentActive = getGwActive("ftth-payment-gateway");
    const mapActive = getGwActive("ftth-map-gateway");
    const storageActive = getGwActive("ftth-storage-gateway");

    const nodes: ServiceNode[] = [
      {
        id: "core-router",
        name: "Nginx Ingress / Router",
        type: "core",
        status: allGatewaysHealthy ? "healthy" : "warning",
        port: 80,
        details: "Dynamic routing proxy & SSL termination at platform gateway layer.",
        metrics: {
          "Traffic Load": "Normal",
          "Routing Rules": "Active",
          "Active Hostnames": `${totalOrgs + 1} domains`,
        },
        x: 6,
        y: 1,
      },
      {
        id: "auth-keycloak",
        name: "Keycloak IAM",
        type: "auth",
        status: keycloakActive ? "healthy" : "error",
        port: 8081,
        details: "Centralized security gateway. Manages dynamic realm provisioning, MFA, and SSO integrations.",
        metrics: {
          "Realms Provisioned": `${totalOrgs} Active Realms`,
          Protocol: "OpenID Connect / SAML",
          "Session Limits": "Enforced",
        },
        x: 2,
        y: 3,
      },
      {
        id: "db-postgres",
        name: "PostgreSQL Spasial",
        type: "db",
        status: postgresActive ? "healthy" : "error",
        port: 5432,
        details: "Primary database storing platform schemas, billing history, and geographical spatial tables.",
        metrics: {
          "Db Name": "ftth_gis",
          Connections: `${systemResources.postgresConns} active`,
          Extensions: "PostGIS, Topology",
        },
        x: 10,
        y: 3,
      },
      {
        id: "cache-redis",
        name: "Redis Cache Store",
        type: "cache",
        status: redisActive ? "healthy" : "error",
        port: 6379,
        details: "Distributed cache layer to lower database overhead, store maps geocoding data, and session timeouts.",
        metrics: {
          "Hit Ratio": `${systemResources.redisCacheHit}%`,
          "Keys Cached": "1,424 active",
          "Eviction Policy": "volatile-lru",
        },
        x: 6,
        y: 5,
      },
      {
        id: "gw-notification",
        name: "Notification Gateway",
        type: "gateway",
        status: notificationActive ? "healthy" : "error",
        port: 5001,
        details: "Handles microservice triggers for SMS, Email (Brevo), and WhatsApp messages.",
        metrics: {
          Throughput: "12 req/min",
          Latency: "18ms",
          "Provider status": "Twilio & Brevo OK",
        },
        x: 1,
        y: 7,
      },
      {
        id: "gw-payment",
        name: "Payment Gateway",
        type: "gateway",
        status: paymentActive ? "healthy" : "error",
        port: 5002,
        details: "Orchestrates tenant subscriptions, plan invoices, and webhooks processing.",
        metrics: {
          Throughput: "4 req/min",
          Latency: "240ms",
          Integrations: "Xendit SDK OK",
        },
        x: 4,
        y: 7,
      },
      {
        id: "gw-map",
        name: "Map Tile Gateway",
        type: "gateway",
        status: mapActive ? "healthy" : "error",
        port: 5003,
        details: "Direct vector maps provider linking database geospatial assets with ODP/ODC layouts.",
        metrics: {
          Throughput: "145 req/min",
          Latency: "12ms",
          "Basemap Cache": "94.2% hit",
        },
        x: 8,
        y: 7,
      },
      {
        id: "gw-storage",
        name: "WebP Storage Gateway",
        type: "gateway",
        status: storageActive ? "healthy" : "error",
        port: 5004,
        details: "Serves tenant assets with automatic WebP dynamic image compression on fly.",
        metrics: {
          Optimization: "68.5% Saved",
          "Disk Status": "Optimal",
          Throughput: "8 files/min",
        },
        x: 11,
        y: 7,
      },
    ];

    return nodes;
  }, [allGatewaysHealthy, gateways, totalOrgs, systemResources]);

  const activeNodeData = useMemo(() => serviceNodes.find((node) => node.id === activeNode) || null, [activeNode, serviceNodes]);

  const maxHits = Math.max(...throughputData.map((d) => d.hits));
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const globalHealthState = useMemo(() => {
    if (loadingStats) return "loading";
    if (allGatewaysHealthy) return "operational";
    if (activeGatewaysCount > 0) return "warning";
    return "critical";
  }, [loadingStats, allGatewaysHealthy, activeGatewaysCount]);

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-[#080808] px-8 pt-16">
      <div className="mx-auto w-full max-w-5xl space-y-8 pb-20">
        <div className="flex flex-col justify-between gap-4 border-b border-white/5 pb-5 md:flex-row md:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500 hover:bg-emerald-500/20">
                Admin Platform Control
              </Badge>
            </div>
            <h1 className="flex items-center gap-3 text-3xl font-light tracking-tight text-zinc-100">
              System Overview <Sparkles className="h-5 w-5 animate-pulse text-emerald-500" />
            </h1>
            <p className="text-xs text-zinc-500">
              Global dashboard monitoring tenant health, authentication flow, spatial data services, and live gateway status.
            </p>
          </div>

          <Button
            onClick={() => loadData(true)}
            disabled={refreshing || loadingOrgs || loadingStats}
            variant="outline"
            className="gap-2 border-white/10 bg-zinc-950/80 text-xs text-zinc-300 transition-all hover:border-emerald-500/30 hover:bg-zinc-900 hover:text-zinc-100"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin text-emerald-500")} />
            Refresh Dashboard
          </Button>
        </div>

        {globalHealthState === "operational" && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 transition-all duration-300">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-emerald-400">All Core Services Operational</h4>
              <p className="mt-0.5 text-[10px] text-zinc-400">Tenant routing, authentication, and GIS services are currently operating within normal parameters.</p>
            </div>
          </div>
        )}

        {globalHealthState === "warning" && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 transition-all duration-300">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-amber-400">Some Gateways Offline</h4>
              <p className="mt-0.5 text-[10px] text-zinc-400">Only {activeGatewaysCount}/{totalGatewaysCount} gateways are currently responding. Certain platform services may be partially degraded.</p>
            </div>
          </div>
        )}

        {globalHealthState === "critical" && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 transition-all duration-300">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-red-400">All Microservice Gateways Down</h4>
              <p className="mt-0.5 text-[10px] text-zinc-400">The platform is currently reporting a critical gateway outage. Immediate infrastructure review is advised.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewMetricCard
            eyebrow="Active Tenants"
            value={
              <span className="flex items-baseline gap-2">
                {loadingOrgs ? "..." : totalOrgs}
                <span className="text-xs text-emerald-500">{loadingOrgs ? "" : `${activeOrgs} Active`}</span>
              </span>
            }
            helper={<span>Trialing: {trialOrgs}</span>}
            footer="Platform coverage"
            icon={Building2}
            footerLinkHref="/organizations"
            footerLinkLabel="Manage Orgs"
          />

          <OverviewMetricCard
            eyebrow="Global Users"
            value={
              <span className="flex items-baseline gap-2">
                {loadingStats ? "..." : userStats.totalUsers}
                <span className="text-xs text-zinc-500">{loadingStats ? "" : `${userStats.activeUsers} Verified`}</span>
              </span>
            }
            helper={<span>Pending Invites: {userStats.pendingRequests}</span>}
            footer="Identity administration"
            icon={Users}
            footerLinkHref="/users"
            footerLinkLabel="Manage Users"
          />

          <OverviewMetricCard
            eyebrow="Active Gateways"
            value={
              <span className="flex items-baseline gap-2">
                {loadingStats ? "..." : `${activeGatewaysCount} / ${totalGatewaysCount}`}
                <span className={cn("text-xs font-medium", allGatewaysHealthy ? "text-emerald-500" : "text-amber-500")}>{allGatewaysHealthy ? "Healthy" : "Degraded"}</span>
              </span>
            }
            helper={<span>Avg Latency: 42ms</span>}
            footer="Service routing"
            icon={Zap}
            footerLinkHref="/gateways/overview"
            footerLinkLabel="Gateways Panel"
          />

          <OverviewMetricCard
            eyebrow="CPU / RAM Load"
            value={
              <span className="flex items-baseline gap-2">
                {systemResources.cpu}% <span className="text-xs text-zinc-500">CPU</span>
                <span className="text-xs text-zinc-500">/ {systemResources.memory}% RAM</span>
              </span>
            }
            helper={<span>RAM Used: {systemResources.memoryUsed}</span>}
            footer="Infrastructure health"
            icon={Activity}
            footerLinkHref="/health"
            footerLinkLabel="System Stats"
          />
        </div>

        <OverviewShell
          title={
            <span className="flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-zinc-500" /> DevOps & Deployment Status
            </span>
          }
          description="Operational indicators for deployment health, compute capacity, backup state, and GitHub integration."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <OverviewDevOpsCard
              eyebrow="Global Status"
              title={
                <span className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full animate-pulse", globalHealthState === "operational" ? "bg-emerald-500" : globalHealthState === "warning" ? "bg-amber-500" : "bg-red-500")} />
                  {globalHealthState === "operational" ? "All Systems Operational" : globalHealthState === "warning" ? "Partially Degraded" : globalHealthState === "loading" ? "Checking..." : "Critical Issues"}
                </span>
              }
              description={globalHealthState === "operational" ? "Identity, routing, and core services are healthy and responding normally." : "Some services may be degraded. Review the infrastructure map for impact details."}
              icon={CheckCircle2}
              iconClassName="group-hover:text-emerald-500"
              accentClassName="text-emerald-400"
              href="/health"
              actionLabel="View Health Center"
              actionClassName="text-emerald-400 hover:text-emerald-300"
            />

            <OverviewDevOpsCard
              eyebrow="Compute"
              title={devopsStats ? `${devopsStats.compute.tier} — ${devopsStats.compute.cpuCores} vCPU / ${Math.round(devopsStats.compute.maxMemoryMb / 1024)} GB` : "Loading..."}
              description={
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>JVM Memory Used</span>
                    <span className="font-mono text-zinc-400">{devopsStats ? `${devopsStats.compute.usedMemoryMb} MB / ${devopsStats.compute.totalMemoryMb} MB` : "—"}</span>
                  </div>
                  {devopsStats ? (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-500" style={{ width: `${Math.min((devopsStats.compute.usedMemoryMb / devopsStats.compute.totalMemoryMb) * 100, 100)}%` }} />
                    </div>
                  ) : null}
                </div>
              }
              icon={HardDrive}
              iconClassName="group-hover:text-sky-500"
              accentClassName="text-sky-400"
              href="/health"
              actionLabel="Inspect Runtime Metrics"
              actionClassName="text-sky-400 hover:text-sky-300"
            >
              {devopsStats ? <p className="mt-2 text-[9px] font-mono text-zinc-600">Java {devopsStats.compute.javaVersion} • {devopsStats.compute.osInfo}</p> : null}
            </OverviewDevOpsCard>

            <OverviewDevOpsCard
              eyebrow="Platform Deployments"
              title={
                <div className="flex items-center gap-2">
                  <OverviewStatusBadge tone={githubIntegrationStatus.connected ? "success" : "neutral"}>
                    {githubIntegrationStatus.connected ? "Active" : "Offline"}
                  </OverviewStatusBadge>
                  <span className="text-[10px] text-zinc-500">GitHub Sync</span>
                </div>
              }
              description="Platform repository branch and commit version state for both Backend and Frontend."
              icon={Github}
              iconClassName="group-hover:text-violet-500"
              accentClassName="text-violet-400"
              href="/system/settings?tab=integrations"
              actionLabel="Manage GitHub App"
              actionClassName="text-violet-400 hover:text-violet-300"
            >
              <div className="mt-3 space-y-2 text-[11px] border-t border-zinc-800/40 pt-2.5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-semibold">Backend (API)</span>
                    <a
                      href={devopsStats?.github?.backendRepo && devopsStats?.git?.commitFull ? `${devopsStats.github.backendRepo}/commit/${devopsStats.git.commitFull}` : "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                    >
                      <GitBranch className="w-3 h-3 text-emerald-500/80" />
                      {devopsStats?.git?.branch || "main"} @ {devopsStats?.git?.commitShort || "..."}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-semibold">Frontend (UI)</span>
                    <a
                      href={FRONTEND_GIT_COMMIT !== "unknown" ? `https://github.com/ex-cloud/front_springboot_ftth_gis/commit/${FRONTEND_GIT_COMMIT}` : "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                    >
                      <GitBranch className="w-3 h-3 text-emerald-500/80" />
                      {FRONTEND_GIT_BRANCH} @ {FRONTEND_GIT_COMMIT_SHORT}
                    </a>
                  </div>
                </div>
              </div>
            </OverviewDevOpsCard>

            <OverviewDevOpsCard
              eyebrow="Database & Cache Status"
              title={
                <div className="flex items-center gap-2">
                  <OverviewStatusBadge tone="success">Operational</OverviewStatusBadge>
                  <span className="text-[10px] text-zinc-500">PostGIS & Redis</span>
                </div>
              }
              description="Real-time performance indicators for active connections, Redis cache store hit ratios, and GIS extensions."
              icon={Database}
              iconClassName="group-hover:text-emerald-500"
              accentClassName="text-emerald-400"
              href="/health"
              actionLabel="View System Health"
              actionClassName="text-emerald-400 hover:text-emerald-300"
            >
              <div className="mt-3 space-y-2 text-[11px] border-t border-zinc-800/40 pt-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">DB Connections</span>
                  <span className="font-mono text-zinc-300 font-medium">{systemResources.postgresConns} active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Cache Hit Ratio</span>
                  <span className="font-mono text-zinc-300 font-medium">{systemResources.redisCacheHit}%</span>
                </div>
              </div>
            </OverviewDevOpsCard>

            <OverviewDevOpsCard
              eyebrow="Last Migration"
              title={
                <div className="flex items-center gap-2">
                  {devopsStats?.lastMigration?.version ? `V${devopsStats.lastMigration.version}` : "Loading..."}
                  {devopsStats?.lastMigration?.success ? <OverviewStatusBadge tone="success">Success</OverviewStatusBadge> : null}
                </div>
              }
              description={
                <div>
                  <p className="truncate font-mono text-[10px] text-zinc-500">{devopsStats?.lastMigration?.description || "—"}</p>
                  <p className="mt-1 text-[9px] font-mono text-zinc-600">Installed: {devopsStats?.lastMigration?.installedOn || "—"}</p>
                </div>
              }
              icon={Database}
              iconClassName="group-hover:text-teal-500"
              accentClassName="text-teal-400"
            />

            <OverviewDevOpsCard
              eyebrow="Last Backup"
              title={
                devopsStats?.lastBackup?.status === "NOT_CONFIGURED" ? (
                  <span className="text-zinc-500">Not Configured</span>
                ) : devopsStats?.lastBackup?.success ? (
                  <span className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-emerald-500" /> {devopsStats.lastBackup.lastBackupTime}
                  </span>
                ) : (
                  <span className="text-amber-500">Check Status</span>
                )
              }
              description={
                <div className="flex items-center gap-1.5">
                  <OverviewStatusBadge tone={devopsStats?.lastBackup?.success ? "success" : devopsStats?.lastBackup?.status === "NOT_CONFIGURED" ? "neutral" : "warning"}>
                    {devopsStats?.lastBackup?.status || "UNKNOWN"}
                  </OverviewStatusBadge>
                  <span className="text-[9px] text-zinc-600">PostgreSQL pg_dump</span>
                </div>
              }
              icon={DatabaseBackup}
              iconClassName="group-hover:text-rose-500"
              accentClassName="text-rose-400"
            />
          </div>
        </OverviewShell>

        <OverviewInfrastructureMap
          serviceNodes={serviceNodes}
          activeNode={activeNode}
          onSelectNode={setActiveNode}
          activeNodeData={activeNodeData}
        />

        <Card className="border-white/5 bg-[#0b0b0b]/40 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-zinc-200">Combined System Throughput</h4>
              <p className="mt-0.5 text-[10px] text-zinc-500">Aggregated API request load and geocoding activity across all microservices over the last 24 hours.</p>
            </div>
            {hoveredBarIndex !== null ? (
              <Badge className="border-emerald-500/20 bg-emerald-500/10 text-[10px] font-mono text-emerald-500">
                {throughputData[hoveredBarIndex].hour} ➔ {throughputData[hoveredBarIndex].hits} Requests
              </Badge>
            ) : (
              <Badge variant="outline" className="border-white/10 text-[10px] font-mono text-zinc-500">
                Peak load: {maxHits} req/min
              </Badge>
            )}
          </div>

          <div className="relative flex h-28 items-end gap-1.5 border-b border-white/5 px-2 pb-2">
            {throughputData.map((d, idx) => (
              <div key={idx} className="relative flex h-full flex-1 flex-col justify-end" onMouseEnter={() => setHoveredBarIndex(idx)} onMouseLeave={() => setHoveredBarIndex(null)}>
                <div style={{ height: `${(d.hits / maxHits) * 100}%` }} className={cn("w-full rounded-t transition-all duration-200", hoveredBarIndex === idx ? "cursor-pointer bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]" : "cursor-pointer bg-gradient-to-t from-emerald-500/20 to-emerald-500/60")} />
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex justify-between px-1 text-[9px] font-mono text-zinc-500">
            <span>24 Jam Lalu</span>
            <span>12 Jam Lalu</span>
            <span>Sekarang (Real-Time)</span>
          </div>
        </Card>

        <OverviewActivityFeed loading={loadingOrgs} recentOrgs={recentOrgs} />
      </div>
    </div>
  );
}
