import { useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useSession } from "@/lib/auth-compat";
import { getGatewayStatus, type GatewayServiceStatus } from "@/lib/actions/gateways";
import { toast } from "sonner";
import type { DevOpsStats, UserStats } from "@/components/system/overview/overview-types";
import type { ThroughputDataPoint } from "@/components/system/overview/overview-throughput-types";

export interface TrafficDistributionData {
  totalHits: number;
  mapHits: number;
  coreHits: number;
  storageHits: number;
  iamHits: number;
  mapPercentage: number;
  corePercentage: number;
  storagePercentage: number;
  iamPercentage: number;
}

export interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  memoryUsedGb: string;
  memoryTotalGb: string;
  diskUsage: number;
  postgresConns: number;
  redisHitRatio: number;
  redisKeysCached: number;
  postgresStatus: string;
  redisStatus: string;
  keycloakStatus: string;
  totalAssets: number;
  spatialLatency: number;
  throughput: Array<ThroughputDataPoint>;
  trafficDistribution?: TrafficDistributionData;
}

export interface GithubIntegrationState {
  connected: boolean;
  organization: string;
  installationTarget: string;
  repositoriesCount: number;
  message: string;
}

const DEFAULT_HEALTH: SystemHealth = {
  cpuUsage: 15,
  memoryUsage: 50,
  memoryUsedGb: "8.0 GB",
  memoryTotalGb: "16.0 GB",
  diskUsage: 40,
  postgresConns: 8,
  redisHitRatio: 95.0,
  redisKeysCached: 0,
  postgresStatus: "healthy",
  redisStatus: "healthy",
  keycloakStatus: "healthy",
  totalAssets: 0,
  spatialLatency: 24,
  throughput: [],
};

const DEFAULT_USER_STATS: UserStats = {
  totalUsers: 0,
  activeUsers: 0,
  pendingRequests: 0,
};

function parseHealthData(healthData: Record<string, unknown>): SystemHealth {
  const system = (healthData?.system ?? {}) as Record<string, unknown>;
  const redis = (healthData?.redis ?? {}) as Record<string, unknown>;
  const services = (healthData?.services ?? {}) as Record<string, unknown>;
  const networkAssets = (healthData?.networkAssets ?? {}) as Record<string, unknown>;
  return {
    cpuUsage: typeof system.cpuUsage === "number" ? system.cpuUsage : 15,
    memoryUsage: typeof system.memoryUsage === "number" ? system.memoryUsage : 50,
    memoryUsedGb: typeof system.memoryUsedGb === "number" ? `${system.memoryUsedGb} GB` : "8.0 GB",
    memoryTotalGb: typeof system.memoryTotalGb === "number" ? `${system.memoryTotalGb} GB` : "16.0 GB",
    diskUsage: typeof system.diskUsage === "number" ? system.diskUsage : 40,
    postgresConns: typeof healthData.postgresConnections === "number" ? healthData.postgresConnections : 8,
    redisHitRatio: typeof redis.hitRatio === "number" ? redis.hitRatio : 95.0,
    redisKeysCached: typeof redis.keysCached === "number" ? redis.keysCached : 0,
    postgresStatus: typeof services.postgres === "string" ? services.postgres : "healthy",
    redisStatus: typeof services.redis === "string" ? services.redis : "healthy",
    keycloakStatus: typeof services.keycloak === "string" ? services.keycloak : "healthy",
    totalAssets: typeof networkAssets.totalAssets === "number" ? networkAssets.totalAssets : 0,
    spatialLatency: typeof healthData.spatialLatency === "number" ? healthData.spatialLatency : 24,
    throughput: Array.isArray(healthData.throughput)
      ? (healthData.throughput as ThroughputDataPoint[])
      : [],
    trafficDistribution: healthData?.trafficDistribution as TrafficDistributionData | undefined,
  };
}

export function useSystemOverviewData() {
  const queryClient = useQueryClient();
  const { organizations, loading: loadingOrgs, refresh: refreshOrgs } = useOrganizations();
  const { data: session, status } = useSession();

  // 1. User stats query with in-memory caching & background refresh
  const {
    data: userStats = DEFAULT_USER_STATS,
    isLoading: loadingUsers,
  } = useQuery<UserStats>({
    queryKey: ["users-stats", session?.accessToken],
    queryFn: async () => {
      if (!session?.accessToken) return DEFAULT_USER_STATS;
      const res = await fetch("/api/v1/users/stats", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) return DEFAULT_USER_STATS;
      return res.json();
    },
    enabled: status === "authenticated" && !!session?.accessToken,
    staleTime: 30_000,
    gcTime: 300_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });

  // 2. System health metrics query
  const {
    data: systemHealth = DEFAULT_HEALTH,
    isLoading: loadingHealth,
  } = useQuery<SystemHealth>({
    queryKey: ["system-health-metrics", session?.accessToken],
    queryFn: async () => {
      if (!session?.accessToken) return DEFAULT_HEALTH;
      const res = await fetch("/api/v1/system/health-metrics", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) return DEFAULT_HEALTH;
      const json = await res.json();
      return parseHealthData(json);
    },
    enabled: status === "authenticated" && !!session?.accessToken,
    staleTime: 30_000,
    gcTime: 300_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });

  // 3. Go Gateway statuses query
  const {
    data: gateways = [],
    isLoading: loadingGateways,
  } = useQuery<GatewayServiceStatus[]>({
    queryKey: ["gateways-status", session?.accessToken],
    queryFn: async () => {
      try {
        const gwRes = await getGatewayStatus();
        return gwRes?.status === "ok" ? gwRes.services : [];
      } catch {
        return [];
      }
    },
    enabled: status === "authenticated" && !!session?.accessToken,
    staleTime: 30_000,
    gcTime: 300_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });

  const loadingStats = loadingUsers || loadingHealth || loadingGateways;

  // Manual refresh callback that invalidates all Overview queries
  const loadData = useCallback(
    async (showToast = false) => {
      await Promise.allSettled([
        refreshOrgs(),
        queryClient.invalidateQueries({ queryKey: ["users-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["system-health-metrics"] }),
        queryClient.invalidateQueries({ queryKey: ["gateways-status"] }),
        queryClient.invalidateQueries({ queryKey: ["recent-operations"] }),
      ]);
      if (showToast) {
        toast.success("Statistik sistem berhasil diperbarui!");
      }
    },
    [queryClient, refreshOrgs]
  );

  // Derived computed values
  const systemResources = useMemo(() => ({
    cpu: systemHealth.cpuUsage,
    memory: systemHealth.memoryUsage,
    memoryUsed: systemHealth.memoryUsedGb,
    memoryTotal: systemHealth.memoryTotalGb,
    disk: systemHealth.diskUsage,
    postgresConns: systemHealth.postgresConns,
    redisCacheHit: systemHealth.redisHitRatio,
  }), [systemHealth]);

  const totalOrgs = organizations.length;
  const activeOrgs = organizations.filter((o) => o.status === "ACTIVE").length;
  const trialOrgs = organizations.filter((o) => o.status === "ACTIVE" && o.trialExpiresAt).length;
  const totalGatewaysCount = gateways.length || 4;
  const activeGatewaysCount = gateways.filter((g) => g.active).length;
  const allGatewaysHealthy = activeGatewaysCount === totalGatewaysCount;

  const recentOrgs = useMemo(() =>
    [...organizations]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5),
    [organizations]
  );

  const avgLatency = useMemo(() => {
    const activeGws = gateways.filter((g) => g.active && g.latency !== undefined);
    if (activeGws.length === 0) return "0ms";
    const sum = activeGws.reduce((acc, g) => acc + (g.latency || 0), 0);
    return `${Math.round(sum / activeGws.length)}ms`;
  }, [gateways]);

  const uptimePercentage = useMemo(() => {
    if (gateways.length === 0) return "100%";
    const activeCount = gateways.filter((g) => g.active).length;
    return `${Math.round((activeCount / gateways.length) * 100)}%`;
  }, [gateways]);

  return {
    organizations,
    userStats,
    gateways,
    devopsStats: null as DevOpsStats | null,
    githubIntegrationStatus: {
      connected: false,
      organization: "",
      installationTarget: "",
      repositoriesCount: 0,
      message: "",
    } as GithubIntegrationState,
    systemHealth,
    trafficDistribution: systemHealth.trafficDistribution,
    systemResources,
    totalOrgs,
    activeOrgs,
    trialOrgs,
    totalGatewaysCount,
    activeGatewaysCount,
    allGatewaysHealthy,
    totalAssets: systemHealth.totalAssets,
    spatialThroughput: systemHealth.trafficDistribution?.mapHits ?? 0,
    spatialLatency: systemHealth.spatialLatency,
    uptimePercentage,
    recentOrgs,
    avgLatency,
    loadingOrgs,
    loadingUsers,
    loadingDevops: false,
    loadingGithub: false,
    loadingHealth,
    loadingGateways,
    loadingStats,
    refreshing: false,
    loadData,
  };
}
