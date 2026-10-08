import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-compat";
import { getBackendBaseUrl } from "@/lib/api-config";
import { httpClient } from "@/lib/httpClient";

declare const __APP_VERSION__: string | undefined;
declare const __GIT_COMMIT_HASH__: string | undefined;

export interface GitInfo {
  branch: string;
  commitShort: string;
  commitFull: string;
  commitMessage: string;
  commitTime: string;
  commitAuthor: string;
}

export interface MigrationInfo {
  version: string;
  description: string;
  installedOn: string;
  success: boolean;
}

export interface ComputeInfo {
  tier: string;
  cpuCores: number;
  maxMemoryMb: number;
  usedMemoryMb: number;
  totalMemoryMb: number;
  javaVersion: string;
  osInfo: string;
  heapUsedMb: number;
  nonHeapUsedMb: number;
  heapMaxMb: number;
}

export interface BucketStats {
  bucketName: string;
  totalObjects: number;
  totalSizeBytes: number;
}

export interface BackupInfo {
  lastBackupTime: string;
  status: string;
  lastStatus: string;
  success: boolean;
  minioStatus: string;
  minioSyncTime: string;
  nextcloudStatus: string;
  nextcloudSyncTime: string;
  nextBackupTime: string;
  dbBackups?: BucketStats;
  codeBackups?: BucketStats;
  dockerBackups?: BucketStats;
}

export interface HostHealthMetrics {
  cpuUsage: number;
  memoryUsage: number;
  memoryUsedGb: number;
  memoryTotalGb: number;
  diskUsage: number;
  postgresConnections: number;
}

export interface PlatformSystemInfoData {
  appVersion: string;
  apiVersion: string;
  gitCommitHash: string;
  gitInfo: GitInfo;
  migrationInfo: MigrationInfo;
  computeInfo: ComputeInfo;
  backupInfo: BackupInfo;
  hostHealth: HostHealthMetrics;
}

function parseGitInfo(raw: Partial<GitInfo> | undefined, fallbackCommit: string): GitInfo {
  const isCommitValid = (c?: string) => Boolean(c && c !== "unknown" && c !== "N/A" && c !== "—");
  const commitShort = isCommitValid(raw?.commitShort) ? raw!.commitShort! : fallbackCommit;
  const commitFull = isCommitValid(raw?.commitFull) ? raw!.commitFull! : fallbackCommit;

  return {
    branch: raw?.branch && raw.branch !== "unknown" ? raw.branch : "main",
    commitShort,
    commitFull,
    commitMessage: raw?.commitMessage && raw.commitMessage !== "N/A" ? raw.commitMessage : `Release commit ${commitShort}`,
    commitTime: raw?.commitTime && raw.commitTime !== "N/A" ? raw.commitTime : "—",
    commitAuthor: raw?.commitAuthor && raw.commitAuthor !== "N/A" ? raw.commitAuthor : "—",
  };
}

function parseMigrationInfo(raw: Partial<MigrationInfo> | undefined): MigrationInfo {
  return {
    version: raw?.version || "—",
    description: raw?.description || "—",
    installedOn: raw?.installedOn || "—",
    success: Boolean(raw?.success ?? false),
  };
}

function parseComputeInfo(raw: Partial<ComputeInfo> | undefined): ComputeInfo {
  return {
    tier: raw?.tier || "SERVER",
    cpuCores: raw?.cpuCores || 0,
    maxMemoryMb: raw?.maxMemoryMb || 0,
    usedMemoryMb: raw?.usedMemoryMb || 0,
    totalMemoryMb: raw?.totalMemoryMb || 0,
    javaVersion: raw?.javaVersion || "—",
    osInfo: raw?.osInfo || "—",
    heapUsedMb: raw?.heapUsedMb || 0,
    nonHeapUsedMb: raw?.nonHeapUsedMb || 0,
    heapMaxMb: raw?.heapMaxMb || 0,
  };
}

function parseBackupInfo(raw: Partial<BackupInfo> | undefined): BackupInfo {
  return {
    lastBackupTime: raw?.lastBackupTime || "—",
    status: raw?.status || "UNKNOWN",
    lastStatus: raw?.lastStatus || "UNKNOWN",
    success: Boolean(raw?.success ?? false),
    minioStatus: raw?.minioStatus || "UNKNOWN",
    minioSyncTime: raw?.minioSyncTime || "—",
    nextcloudStatus: raw?.nextcloudStatus || "UNKNOWN",
    nextcloudSyncTime: raw?.nextcloudSyncTime || "—",
    nextBackupTime: raw?.nextBackupTime || "—",
    dbBackups: raw?.dbBackups,
    codeBackups: raw?.codeBackups,
    dockerBackups: raw?.dockerBackups,
  };
}

function parseHostHealth(rawHealth: Record<string, unknown> | undefined): HostHealthMetrics {
  const sys = (rawHealth?.system as Record<string, unknown>) || {};
  return {
    cpuUsage: Number(sys.cpuUsage || 0),
    memoryUsage: Number(sys.memoryUsage || 0),
    memoryUsedGb: Number(sys.memoryUsedGb || 0),
    memoryTotalGb: Number(sys.memoryTotalGb || 0),
    diskUsage: Number(sys.diskUsage || 0),
    postgresConnections: Number(rawHealth?.postgresConnections || 0),
  };
}

function parseSystemInfoPayload(
  devopsData: Record<string, unknown>,
  healthData: Record<string, unknown>,
  appVersion: string,
  defaultCommit: string
): PlatformSystemInfoData {
  const git = parseGitInfo(devopsData.git as Partial<GitInfo>, defaultCommit);
  const migration = parseMigrationInfo(devopsData.lastMigration as Partial<MigrationInfo>);
  const compute = parseComputeInfo(devopsData.compute as Partial<ComputeInfo>);
  const backup = parseBackupInfo(devopsData.lastBackup as Partial<BackupInfo>);
  const hostHealth = parseHostHealth(healthData);

  return {
    appVersion,
    apiVersion: "/api/v1",
    gitCommitHash: git.commitShort,
    gitInfo: git,
    migrationInfo: migration,
    computeInfo: compute,
    backupInfo: backup,
    hostHealth,
  };
}

export function usePlatformSystemInfo() {
  const { data: session, status } = useSession();

  const appVersion = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "v1.0.0";
  const defaultCommit = typeof __GIT_COMMIT_HASH__ !== "undefined" ? __GIT_COMMIT_HASH__ : "dev";

  const {
    data,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery<PlatformSystemInfoData>({
    queryKey: ["platform-system-info", session?.accessToken, appVersion, defaultCommit],
    queryFn: async () => {
      const baseUrl = getBackendBaseUrl();
      const token = session?.accessToken || undefined;

      let devopsData: Record<string, unknown> = {};
      let healthData: Record<string, unknown> = {};

      const [devopsRes, healthRes] = await Promise.allSettled([
        httpClient(`${baseUrl}/system/devops-stats`, { token }),
        httpClient(`${baseUrl}/system/health-metrics`, { token }),
      ]);

      if (devopsRes.status === "fulfilled" && devopsRes.value.ok) {
        devopsData = (await devopsRes.value.json()) as Record<string, unknown>;
      }

      if (healthRes.status === "fulfilled" && healthRes.value.ok) {
        healthData = (await healthRes.value.json()) as Record<string, unknown>;
      }

      return parseSystemInfoPayload(devopsData, healthData, appVersion, defaultCommit);
    },
    enabled: status === "authenticated" && !!session?.accessToken,
    staleTime: 30 * 1000,
    retry: 1,
  });

  return {
    info: data,
    loading: isLoading,
    refreshing: isRefetching,
    error,
    refresh: refetch,
  };
}
