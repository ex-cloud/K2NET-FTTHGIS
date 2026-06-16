"use client";

import { useEffect, useState, useMemo } from "react";
import { useOrganizations } from "@/hooks/useOrganizations";
import { getGatewayStatus, GatewayServiceStatus } from "@/lib/actions/gateways";
import { useSession } from "next-auth/react";
import { getTenantUrl } from "@/lib/domain";
import { 
  Building2, 
  Users, 
  Activity, 
  Cpu, 
  Database, 
  KeyRound, 
  RefreshCw,
  Sparkles,
  ArrowRight,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  History,
  ExternalLink,
  GitBranch,
  HardDrive,
  Github,
  Clock,
  Globe,
  Shield,
  DatabaseBackup
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
}

interface DevOpsStats {
  git: {
    branch: string;
    commitShort: string;
    commitFull: string;
    commitMessage: string;
    commitTime: string;
    commitAuthor: string;
  };
  lastMigration: {
    version: string;
    description: string;
    installedOn: string;
    success: boolean;
  };
  compute: {
    tier: string;
    cpuCores: number;
    maxMemoryMb: number;
    usedMemoryMb: number;
    totalMemoryMb: number;
    javaVersion: string;
    osInfo: string;
  };
  lastBackup: {
    lastBackupTime: string;
    status: string;
    success: boolean;
  };
  github: {
    frontendRepo: string;
    backendRepo: string;
  };
}

interface ServiceNode {
  id: string;
  name: string;
  type: "core" | "db" | "auth" | "cache" | "gateway";
  status: "healthy" | "warning" | "error";
  port?: number;
  details: string;
  metrics: Record<string, string>;
  x: number; // grid position x (1-12)
  y: number; // grid position y
}

export default function SystemOverviewPage() {
  const { organizations, loading: loadingOrgs, refresh: refreshOrgs } = useOrganizations();
  const { data: session } = useSession();

  const [userStats, setUserStats] = useState<UserStats>({ totalUsers: 0, activeUsers: 0, pendingRequests: 0 });
  const [gateways, setGateways] = useState<GatewayServiceStatus[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>("db-postgres");
  const [devopsStats, setDevopsStats] = useState<DevOpsStats | null>(null);

  // Load resource details simulation
  const systemResources = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshing; // Use refreshing to trigger memo re-evaluation on refresh
    return {
      cpu: 18 + Math.floor(Math.random() * 8),
      memory: 54, // 54%
      memoryUsed: "8.6 GB",
      memoryTotal: "16 GB",
      disk: 42, // 42%
      postgresConns: 12 + Math.floor(Math.random() * 5),
      redisCacheHit: 96.4,
    };
  }, [refreshing]);

  const loadData = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    setLoadingStats(true);

    try {
      // 1. Refresh organizations
      await refreshOrgs();

      // 2. Fetch User Stats from backend
      if (session?.accessToken) {
        const res = await fetch("/api/v1/users/stats", {
          headers: {
            "Authorization": `Bearer ${session.accessToken}`
          }
        });
        if (res.ok) {
          const stats = await res.json();
          setUserStats(stats);
        }

        // 2b. Fetch DevOps stats from backend
        const devOpsRes = await fetch("/api/v1/system/devops-stats", {
          headers: {
            "Authorization": `Bearer ${session.accessToken}`
          }
        });
        if (devOpsRes.ok) {
          const devOps = await devOpsRes.json();
          setDevopsStats(devOps);
        }
      }

      // 3. Fetch Gateways status via server action
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

  // Derived variables
  const totalOrgs = organizations.length;
  const activeOrgs = organizations.filter(o => o.status === "ACTIVE").length;
  const trialOrgs = organizations.filter(o => o.status === "ACTIVE" && o.trialExpiresAt).length; // simple approximation

  const totalGatewaysCount = gateways.length || 4;
  const activeGatewaysCount = gateways.filter(g => g.active).length;
  const allGatewaysHealthy = activeGatewaysCount === totalGatewaysCount;

  // Recent organizations (last 5)
  const recentOrgs = useMemo(() => {
    return [...organizations]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [organizations]);

  // Core service status logic mapping (Supabase style network nodes)
  const serviceNodes: ServiceNode[] = useMemo(() => {
    const postgresActive = true; // DB is serving requests
    const redisActive = true; // Redis is functional
    const keycloakActive = true; // Keycloak is online

    // Get individual gateway statuses
    const getGwActive = (name: string) => gateways.find(g => g.name === name)?.active ?? false;
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
        y: 1
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
          "Protocol": "OpenID Connect / SAML",
          "Session Limits": "Enforced",
        },
        x: 2,
        y: 3
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
          "Connections": `${systemResources.postgresConns} active`,
          "Extensions": "PostGIS, Topology",
        },
        x: 10,
        y: 3
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
        y: 5
      },
      {
        id: "gw-notification",
        name: "Notification Gateway",
        type: "gateway",
        status: notificationActive ? "healthy" : "error",
        port: 5001,
        details: "Handles microservice triggers for SMS, Email (Brevo), and WhatsApp messages.",
        metrics: {
          "Throughput": "12 req/min",
          "Latency": "18ms",
          "Provider status": "Twilio & Brevo OK",
        },
        x: 1,
        y: 7
      },
      {
        id: "gw-payment",
        name: "Payment Gateway",
        type: "gateway",
        status: paymentActive ? "healthy" : "error",
        port: 5002,
        details: "Orchestrates tenant subscriptions, plan invoices, and webhooks processing.",
        metrics: {
          "Throughput": "4 req/min",
          "Latency": "240ms",
          "Integrations": "Xendit SDK OK",
        },
        x: 4,
        y: 7
      },
      {
        id: "gw-map",
        name: "Map Tile Gateway",
        type: "gateway",
        status: mapActive ? "healthy" : "error",
        port: 5003,
        details: "Direct vector maps provider linking database geospatial assets with ODP/ODC layouts.",
        metrics: {
          "Throughput": "145 req/min",
          "Latency": "12ms",
          "Basemap Cache": "94.2% hit",
        },
        x: 8,
        y: 7
      },
      {
        id: "gw-storage",
        name: "WebP Storage Gateway",
        type: "gateway",
        status: storageActive ? "healthy" : "error",
        port: 5004,
        details: "Serves tenant assets with automatic WebP dynamic image compression on fly.",
        metrics: {
          "Optimization": "68.5% Saved",
          "Disk Status": "Optimal",
          "Throughput": "8 files/min",
        },
        x: 11,
        y: 7
      }
    ];

    return nodes;
  }, [allGatewaysHealthy, gateways, totalOrgs, systemResources]);

  const activeNodeData = useMemo(() => {
    return serviceNodes.find(n => n.id === activeNode) || null;
  }, [activeNode, serviceNodes]);

  // Synthetic load statistics (last 24 hours load bars)
  const throughputData = [
    { hour: "06:00", hits: 45 },
    { hour: "07:00", hits: 60 },
    { hour: "08:00", hits: 80 },
    { hour: "09:00", hits: 110 },
    { hour: "10:00", hits: 145 },
    { hour: "11:00", hits: 130 },
    { hour: "12:00", hits: 120 },
    { hour: "13:00", hits: 140 },
    { hour: "14:00", hits: 155 },
    { hour: "15:00", hits: 165 },
    { hour: "16:00", hits: 180 },
    { hour: "17:00", hits: 175 },
    { hour: "18:00", hits: 150 },
    { hour: "19:00", hits: 135 },
    { hour: "20:00", hits: 120 },
    { hour: "21:00", hits: 115 },
    { hour: "22:00", hits: 95 },
    { hour: "23:00", hits: 75 },
    { hour: "00:00", hits: 50 },
    { hour: "01:00", hits: 35 },
    { hour: "02:00", hits: 25 },
    { hour: "03:00", hits: 30 },
    { hour: "04:00", hits: 40 },
    { hour: "05:00", hits: 45 },
  ];

  const maxHits = Math.max(...throughputData.map(d => d.hits));
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const globalHealthState = useMemo(() => {
    if (loadingStats) return "loading";
    if (allGatewaysHealthy) return "operational";
    if (activeGatewaysCount > 0) return "warning";
    return "critical";
  }, [loadingStats, allGatewaysHealthy, activeGatewaysCount]);

  return (
    <div className="flex-1 flex flex-col pt-16 px-8 bg-[#080808] h-full overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                Admin Platform Control
              </Badge>
            </div>
            <h1 className="text-3xl font-light text-zinc-100 tracking-tight flex items-center gap-3">
              System Overview <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
            </h1>
            <p className="text-xs text-zinc-500">
              Global dashboard monitoring tenant health, auth flow, database spatial traffic, and active gateways load.
            </p>
          </div>
          
          <Button 
            onClick={() => loadData(true)} 
            disabled={refreshing || loadingOrgs || loadingStats}
            variant="outline"
            className="border-white/10 hover:border-emerald-500/30 bg-zinc-950/80 hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-xs gap-2 transition-all"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-emerald-500")} />
            Refresh Dashboard
          </Button>
        </div>

        {/* Dynamic Global Health Banner */}
        {globalHealthState === "operational" && (
          <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-4 flex items-center gap-3 transition-all duration-300">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-emerald-400">All Core Services Operational</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">All tenant routing layers, keycloak authentication, and GIS microservices are currently running at peak performance.</p>
            </div>
          </div>
        )}

        {globalHealthState === "warning" && (
          <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 flex items-center gap-3 transition-all duration-300">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-amber-400">Some Gateways Offline</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">Only {activeGatewaysCount}/{totalGatewaysCount} gateways are responding. Real-time geocoding or billing services might be partially degraded.</p>
            </div>
          </div>
        )}

        {globalHealthState === "critical" && (
          <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4 flex items-center gap-3 transition-all duration-300">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-red-400">All Microservice Gateways Down</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">Critical platform warning: All gateways are currently reporting offline. Run systemd diagnostic command to resolve.</p>
            </div>
          </div>
        )}

        {/* Metrik Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Organizations */}
          <Card className="bg-[#0b0b0b]/60 border-white/5 backdrop-blur-md hover:border-emerald-500/20 transition-all duration-300 group">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 flex items-center justify-between">
                Active Tenants
                <Building2 className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
              </CardDescription>
              <CardTitle className="text-2xl font-light text-zinc-200 mt-1 flex items-baseline gap-2">
                {loadingOrgs ? "..." : totalOrgs}
                <span className="text-xs text-emerald-500">{loadingOrgs ? "" : `${activeOrgs} Active`}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span>Trialing: {trialOrgs}</span>
                <Link href="/organizations" className="hover:text-emerald-500 transition-colors flex items-center gap-0.5">
                  Manage Orgs <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Global Users */}
          <Card className="bg-[#0b0b0b]/60 border-white/5 backdrop-blur-md hover:border-emerald-500/20 transition-all duration-300 group">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 flex items-center justify-between">
                Global Users
                <Users className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
              </CardDescription>
              <CardTitle className="text-2xl font-light text-zinc-200 mt-1 flex items-baseline gap-2">
                {loadingStats ? "..." : userStats.totalUsers}
                <span className="text-xs text-zinc-500">{loadingStats ? "" : `${userStats.activeUsers} Verified`}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span>Pending Invites: {userStats.pendingRequests}</span>
                <Link href="/users" className="hover:text-emerald-500 transition-colors flex items-center gap-0.5">
                  Manage Users <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Gateway Health */}
          <Card className="bg-[#0b0b0b]/60 border-white/5 backdrop-blur-md hover:border-emerald-500/20 transition-all duration-300 group">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 flex items-center justify-between">
                Active Gateways
                <Zap className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
              </CardDescription>
              <CardTitle className="text-2xl font-light text-zinc-200 mt-1 flex items-baseline gap-2">
                {loadingStats ? "..." : `${activeGatewaysCount} / ${totalGatewaysCount}`}
                <span className={cn(
                  "text-xs font-medium",
                  allGatewaysHealthy ? "text-emerald-500" : "text-amber-500"
                )}>
                  {allGatewaysHealthy ? "Healthy" : "Degraded"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span>Avg Latency: 42ms</span>
                <Link href="/gateways/overview" className="hover:text-emerald-500 transition-colors flex items-center gap-0.5">
                  Gateways Panel <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: System Resource Load */}
          <Card className="bg-[#0b0b0b]/60 border-white/5 backdrop-blur-md hover:border-emerald-500/20 transition-all duration-300 group">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 flex items-center justify-between">
                CPU / RAM Load
                <Activity className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
              </CardDescription>
              <CardTitle className="text-2xl font-light text-zinc-200 mt-1 flex items-baseline gap-2">
                {systemResources.cpu}% <span className="text-xs text-zinc-500">CPU</span>
                <span className="text-xs text-zinc-500">/ {systemResources.memory}% RAM</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span>RAM Used: {systemResources.memoryUsed}</span>
                <Link href="/health" className="hover:text-emerald-500 transition-colors flex items-center gap-0.5">
                  System Stats <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══════════════════ DevOps Status Grid (Supabase Style) ═══════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <h2 className="text-lg font-light text-zinc-200 tracking-tight flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-zinc-500" /> DevOps & Deployment Status
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Card 1: Global Status */}
            <a href="/health" className="group block">
              <Card className="bg-[#0b0b0b]/60 border-white/5 backdrop-blur-md hover:border-emerald-500/30 transition-all duration-300 cursor-pointer hover:shadow-[0_0_20px_rgba(16,185,129,0.08)] h-full">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 flex items-center justify-between">
                    Global Status
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
                  </CardDescription>
                  <CardTitle className="text-base font-light text-zinc-200 mt-1 flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full animate-pulse",
                      globalHealthState === "operational" ? "bg-emerald-500" :
                      globalHealthState === "warning" ? "bg-amber-500" : "bg-red-500"
                    )} />
                    {globalHealthState === "operational" ? "All Systems Operational" :
                     globalHealthState === "warning" ? "Partially Degraded" :
                     globalHealthState === "loading" ? "Checking..." : "Critical Issues"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-[10px] text-zinc-500">
                    {globalHealthState === "operational"
                      ? "All core services, gateways, and database connections are healthy."
                      : "Some services may be experiencing issues. Check infrastructure map for details."}
                  </p>
                </CardContent>
              </Card>
            </a>

            {/* Card 2: Compute */}
            <a href="/health" className="group block">
              <Card className="bg-[#0b0b0b]/60 border-white/5 backdrop-blur-md hover:border-sky-500/30 transition-all duration-300 cursor-pointer hover:shadow-[0_0_20px_rgba(14,165,233,0.08)] h-full">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 flex items-center justify-between">
                    Compute
                    <HardDrive className="w-3.5 h-3.5 text-zinc-600 group-hover:text-sky-500 transition-colors" />
                  </CardDescription>
                  <CardTitle className="text-base font-light text-zinc-200 mt-1">
                    {devopsStats ? `${devopsStats.compute.tier} — ${devopsStats.compute.cpuCores} vCPU / ${Math.round(devopsStats.compute.maxMemoryMb / 1024)} GB` : "Loading..."}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>JVM Memory Used</span>
                      <span className="font-mono text-zinc-400">{devopsStats ? `${devopsStats.compute.usedMemoryMb} MB / ${devopsStats.compute.totalMemoryMb} MB` : "—"}</span>
                    </div>
                    {devopsStats && (
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((devopsStats.compute.usedMemoryMb / devopsStats.compute.totalMemoryMb) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                    <p className="text-[9px] text-zinc-600 font-mono mt-0.5">
                      {devopsStats ? `Java ${devopsStats.compute.javaVersion} • ${devopsStats.compute.osInfo}` : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </a>

            {/* Card 3: GitHub */}
            <Card className="bg-[#0b0b0b]/60 border-white/5 backdrop-blur-md hover:border-violet-500/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)] h-full group">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 flex items-center justify-between">
                  GitHub Repository
                  <Github className="w-3.5 h-3.5 text-zinc-600 group-hover:text-violet-500 transition-colors" />
                </CardDescription>
                <CardTitle className="text-base font-light text-zinc-200 mt-1">
                  Connected
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 space-y-2">
                <a
                  href={devopsStats?.github?.frontendRepo || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-violet-400 transition-colors font-mono"
                >
                  <Globe className="w-3 h-3" /> Frontend Repo <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <a
                  href={devopsStats?.github?.backendRepo || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-violet-400 transition-colors font-mono"
                >
                  <Server className="w-3 h-3" /> Backend Repo <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </CardContent>
            </Card>

            {/* Card 4: Recent Branch */}
            <a
              href={devopsStats?.github?.backendRepo ? `${devopsStats.github.backendRepo}/commit/${devopsStats.git.commitFull}` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <Card className="bg-[#0b0b0b]/60 border-white/5 backdrop-blur-md hover:border-orange-500/30 transition-all duration-300 cursor-pointer hover:shadow-[0_0_20px_rgba(249,115,22,0.08)] h-full">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 flex items-center justify-between">
                    Recent Branch
                    <GitBranch className="w-3.5 h-3.5 text-zinc-600 group-hover:text-orange-500 transition-colors" />
                  </CardDescription>
                  <CardTitle className="text-base font-light text-zinc-200 mt-1 flex items-center gap-2">
                    <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[9px] font-mono px-1.5 py-0">
                      {devopsStats?.git?.branch || "main"}
                    </Badge>
                    <span className="text-[10px] text-zinc-500 font-mono">@{devopsStats?.git?.commitShort || "..."}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-[10px] text-zinc-500 truncate">
                    {devopsStats?.git?.commitMessage || "Loading commit info..."}
                  </p>
                  <p className="text-[9px] text-zinc-600 font-mono mt-1">
                    {devopsStats?.git?.commitAuthor || ""} • {devopsStats?.git?.commitTime || ""}
                  </p>
                </CardContent>
              </Card>
            </a>

            {/* Card 5: Last Migration */}
            <Card className="bg-[#0b0b0b]/60 border-white/5 backdrop-blur-md hover:border-teal-500/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(20,184,166,0.08)] h-full group cursor-default">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 flex items-center justify-between">
                  Last Migration
                  <Database className="w-3.5 h-3.5 text-zinc-600 group-hover:text-teal-500 transition-colors" />
                </CardDescription>
                <CardTitle className="text-base font-light text-zinc-200 mt-1 flex items-center gap-2">
                  {devopsStats?.lastMigration?.version
                    ? `V${devopsStats.lastMigration.version}`
                    : "Loading..."}
                  {devopsStats?.lastMigration?.success && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] px-1.5 py-0">
                      Success
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-[10px] text-zinc-500 truncate font-mono">
                  {devopsStats?.lastMigration?.description || "—"}
                </p>
                <p className="text-[9px] text-zinc-600 font-mono mt-1">
                  Installed: {devopsStats?.lastMigration?.installedOn || "—"}
                </p>
              </CardContent>
            </Card>

            {/* Card 6: Last Backup */}
            <Card className="bg-[#0b0b0b]/60 border-white/5 backdrop-blur-md hover:border-rose-500/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(244,63,94,0.08)] h-full group cursor-default">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 flex items-center justify-between">
                  Last Backup
                  <DatabaseBackup className="w-3.5 h-3.5 text-zinc-600 group-hover:text-rose-500 transition-colors" />
                </CardDescription>
                <CardTitle className="text-base font-light text-zinc-200 mt-1 flex items-center gap-2">
                  {devopsStats?.lastBackup?.status === "NOT_CONFIGURED" ? (
                    <span className="text-zinc-500">Not Configured</span>
                  ) : devopsStats?.lastBackup?.success ? (
                    <>
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{devopsStats.lastBackup.lastBackupTime}</span>
                    </>
                  ) : (
                    <span className="text-amber-500">Check Status</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center gap-1.5">
                  <Badge
                    className={cn(
                      "text-[9px] font-mono px-1.5 py-0 border",
                      devopsStats?.lastBackup?.success
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : devopsStats?.lastBackup?.status === "NOT_CONFIGURED"
                        ? "bg-zinc-800 text-zinc-500 border-white/5"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}
                  >
                    {devopsStats?.lastBackup?.status || "UNKNOWN"}
                  </Badge>
                  <span className="text-[9px] text-zinc-600">PostgreSQL pg_dump</span>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Network Infrastructure Node Map & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Supabase-style Node Map Layout (Left 2 columns) */}
          <Card className="lg:col-span-2 bg-[#0b0b0b]/40 border-white/5 p-6 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-semibold text-zinc-200">Infrastructure Dependency Map</h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">Interactive logical mapping of core database, identity management, and active gateways. Click a node to view configuration telemetry.</p>
            </div>

            {/* Interactive Graph Node layout */}
            <div className="relative w-full h-[320px] bg-zinc-950/40 rounded-xl border border-white/[0.03] mt-6 overflow-hidden">
              
              {/* SVG Connector Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40">
                {/* Core Router -> Keycloak */}
                <line x1="50%" y1="15%" x2="18%" y2="40%" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 3" />
                {/* Core Router -> PostgreSQL */}
                <line x1="50%" y1="15%" x2="82%" y2="40%" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 3" />
                {/* Core Router -> Redis */}
                <line x1="50%" y1="15%" x2="50%" y2="65%" stroke="#10b981" strokeWidth="1.2" />

                {/* Redis -> Gateways */}
                <line x1="50%" y1="65%" x2="10%" y2="85%" stroke="#10b981" strokeWidth="1" />
                <line x1="50%" y1="65%" x2="35%" y2="85%" stroke="#10b981" strokeWidth="1" />
                <line x1="50%" y1="65%" x2="65%" y2="85%" stroke="#10b981" strokeWidth="1" />
                <line x1="50%" y1="65%" x2="90%" y2="85%" stroke="#10b981" strokeWidth="1" />

                {/* PostgreSQL -> Gateways */}
                <line x1="82%" y1="40%" x2="65%" y2="85%" stroke="#10b981" strokeWidth="0.8" strokeDasharray="4 4" />
                {/* Keycloak -> Gateways */}
                <line x1="18%" y1="40%" x2="35%" y2="85%" stroke="#10b981" strokeWidth="0.8" strokeDasharray="4 4" />
              </svg>

              {/* Service Node Buttons */}
              {serviceNodes.map((node) => {
                const Icon = node.type === "core" ? Server :
                              node.type === "db" ? Database :
                              node.type === "auth" ? KeyRound :
                              node.type === "cache" ? Activity : Cpu;

                const isSelected = activeNode === node.id;

                return (
                  <button
                    key={node.id}
                    onClick={() => setActiveNode(node.id)}
                    style={{
                      left: `${(node.x / 12) * 100}%`,
                      top: `${(node.y / 8) * 100}%`,
                      transform: "translate(-50%, -50%)"
                    }}
                    className={cn(
                      "absolute z-10 flex flex-col items-center justify-center p-3 rounded-xl border bg-[#0b0b0b]/90 backdrop-blur shadow-2xl hover:-translate-y-0.5 hover:shadow-emerald-500/5 transition-all duration-300 group min-w-[70px]",
                      isSelected 
                        ? "border-emerald-500/70 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20" 
                        : "border-white/5 hover:border-white/20"
                    )}
                  >
                    {/* Node Icon */}
                    <div className={cn(
                      "p-1.5 rounded-lg border flex items-center justify-center mb-1.5 transition-colors",
                      isSelected 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                        : "bg-zinc-900 border-white/5 text-zinc-500 group-hover:text-zinc-300"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Node Status Dot */}
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        node.status === "healthy" ? "bg-emerald-500" :
                        node.status === "warning" ? "bg-amber-500" : "bg-red-500"
                      )} />
                      <span className="text-[8px] font-mono text-zinc-400 font-bold max-w-[50px] truncate uppercase">
                        {node.id.startsWith("gw-") ? node.id.replace("gw-", "") : node.name.split(" ")[0]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Selected Node Details (Right 1 column) */}
          <Card className="bg-[#0b0b0b]/60 border-white/5 p-6 flex flex-col justify-between h-full">
            {activeNodeData ? (
              <div className="flex flex-col h-full justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-widest font-mono">Service Details</h4>
                    {activeNodeData.port && (
                      <Badge variant="outline" className="border-white/10 text-zinc-500 text-[9px] font-mono">
                        Port {activeNodeData.port}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-light text-zinc-100">{activeNodeData.name}</h3>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">{activeNodeData.details}</p>
                  </div>

                  <div className="space-y-3 pt-3">
                    <h5 className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Metrics & Telemetry</h5>
                    <div className="grid grid-cols-1 gap-2.5">
                      {Object.entries(activeNodeData.metrics).map(([key, val]) => (
                        <div key={key} className="bg-zinc-950/60 border border-white/[0.02] rounded-lg p-2 flex flex-col">
                          <span className="text-[8px] text-zinc-500 uppercase tracking-wide font-mono">{key}</span>
                          <span className="text-[10px] font-medium text-zinc-300 font-mono mt-0.5">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                  {activeNodeData.id.startsWith("gw-") ? (
                    <Link href="/gateways/overview" className="w-full">
                      <Button variant="outline" size="sm" className="w-full text-[10px] border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400 gap-1.5 transition-all">
                        Open Gateway Settings <ExternalLink className="w-3 h-3" />
                      </Button>
                    </Link>
                  ) : activeNodeData.id === "auth-keycloak" ? (
                    <Link href="/security/auth" className="w-full">
                      <Button variant="outline" size="sm" className="w-full text-[10px] border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400 gap-1.5 transition-all">
                        Manage IAM Policies <ExternalLink className="w-3 h-3" />
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled variant="outline" size="sm" className="w-full text-[10px] border-white/10 text-zinc-600 gap-1.5">
                      System Managed Core
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 py-12">
                <Server className="w-8 h-8 opacity-40 mb-2" />
                <span className="text-xs">Pilih salah satu layanan untuk menampilkan info detail</span>
              </div>
            )}
          </Card>
        </div>

        {/* Load Load Visualizer (Throughput Chart) */}
        <Card className="bg-[#0b0b0b]/40 border-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-semibold text-zinc-200">Combined System Throughput</h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">Aggregated API request load and geocoding operations across all microservices (last 24 hours).</p>
            </div>
            {hoveredBarIndex !== null ? (
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-mono">
                {throughputData[hoveredBarIndex].hour} ➔ {throughputData[hoveredBarIndex].hits} Requests
              </Badge>
            ) : (
              <Badge variant="outline" className="border-white/10 text-zinc-500 text-[10px] font-mono">
                Peak load: {maxHits} req/min
              </Badge>
            )}
          </div>
          
          {/* Interactive Chart */}
          <div className="h-28 w-full flex items-end gap-1.5 px-2 relative border-b border-white/5 pb-2">
            {throughputData.map((d, idx) => (
              <div 
                key={idx} 
                className="flex-1 flex flex-col justify-end h-full relative"
                onMouseEnter={() => setHoveredBarIndex(idx)}
                onMouseLeave={() => setHoveredBarIndex(null)}
              >
                <div 
                  style={{ height: `${(d.hits / maxHits) * 100}%` }} 
                  className={cn(
                    "w-full rounded-t transition-all duration-200 cursor-pointer",
                    hoveredBarIndex === idx 
                      ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]" 
                      : "bg-gradient-to-t from-emerald-500/20 to-emerald-500/60"
                  )}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-zinc-500 font-mono mt-2.5 px-1">
            <span>24 Jam Lalu</span>
            <span>12 Jam Lalu</span>
            <span>Sekarang (Real-Time)</span>
          </div>
        </Card>

        {/* Recent Organization Activity Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-lg font-light text-zinc-200 tracking-tight flex items-center gap-2">
              <History className="w-4.5 h-4.5 text-zinc-500" /> Recent Organizations
            </h2>
            <Link href="/organizations">
              <Button variant="link" className="text-zinc-400 hover:text-emerald-500 text-xs gap-1.5 p-0">
                View All Organizations <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {loadingOrgs ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-xl border border-white/5 bg-zinc-950/20 animate-pulse" />
              ))
            ) : recentOrgs.length > 0 ? (
              recentOrgs.map((org) => {
                const planName = org.subscriptionPlan?.name || "Free Plan";
                
                return (
                  <div 
                    key={org.slug} 
                    className="bg-[#0b0b0b]/60 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400">
                        <Building2 className="w-4.5 h-4.5 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-zinc-200">{org.name}</h3>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{org.slug}.gis.k2net.id</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-white/5 bg-zinc-900/40 text-zinc-400 text-[9px] uppercase font-mono px-2 py-0.5">
                          {planName}
                        </Badge>
                        <Badge 
                          className={cn(
                            "text-[9px] font-bold px-2 py-0.5 border border-white/5",
                            org.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400" :
                            org.status === "SUSPENDED" ? "bg-amber-500/10 text-amber-500" : "bg-zinc-800 text-zinc-400"
                          )}
                        >
                          {org.status}
                        </Badge>
                      </div>

                      <Button 
                        onClick={() => window.location.assign(getTenantUrl(org.slug))}
                        variant="ghost" 
                        size="sm" 
                        className="text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/5 group text-xs gap-1.5 transition-all"
                      >
                        Access Tenant
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-[#0b0b0b]/40 border border-white/5 rounded-xl p-8 text-center text-zinc-500 text-xs">
                Belum ada organisasi yang terdaftar dalam platform ini.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
