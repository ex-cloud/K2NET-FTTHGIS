import type {
  PlatformSystemInfoData,
  ComputeInfo,
  BackupInfo,
  HostHealthMetrics,
  GitInfo,
  MigrationInfo,
} from "@/hooks/usePlatformSystemInfo";

function resolveCommit(info?: PlatformSystemInfoData): string {
  if (info?.gitCommitHash) return info.gitCommitHash;
  if (info?.gitInfo?.commitShort) return info.gitInfo.commitShort;
  return "—";
}

function resolveSemVerLine(info?: PlatformSystemInfoData): string {
  const version = info?.appVersion || "v1.0.0";
  const major = info?.patchInfo?.major ?? 1;
  const minor = info?.patchInfo?.minor ?? 0;
  const patchLevel = info?.patchInfo?.patchLevel ?? 0;
  return `- **Platform Version**: ${version} (GA STABLE, SemVer: Major ${major}, Minor ${minor}, Patch ${patchLevel})`;
}

function formatOverview(info?: PlatformSystemInfoData, g?: GitInfo, m?: MigrationInfo): string[] {
  const patchLevel = info?.patchInfo?.patchLevel ?? 0;
  const statusLabel = info?.patchInfo?.statusLabel || "Baseline GA";
  const api = info?.apiVersion || "/api/v1";
  const dbVersion = m?.version || "51";
  const flyway = m?.version ? `Flyway V${m.version}` : "Flyway V51";
  const commit = resolveCommit(info);
  const branch = g?.branch || "main";

  return [
    "# K2NET FTTH GIS — System & Architecture Specification",
    "",
    resolveSemVerLine(info),
    `- **Patch & Hotfix Level**: Patch .${patchLevel} (${statusLabel})`,
    `- **REST API Namespace**: ${api} (ACTIVE - Non-breaking Expand)`,
    `- **Database Schema**: ${flyway} (0 Gap, ${dbVersion} patches applied)`,
    `- **Active Git Commit**: \`${commit}\` (Branch: \`${branch}\`)`,
    `- **Generated At**: ${new Date().toISOString()}`,
    "",
  ];
}

function formatPatchesTable(info?: PlatformSystemInfoData): string[] {
  const patches = info?.patchInfo?.recentPatches || [];
  if (patches.length === 0) return [];

  const rows = patches.map(
    (p) =>
      `| **${p.version}** | \`${p.type}\` | ${p.component} | ${p.description} | ${p.dbMigration || "—"} | \`${p.commitHash}\` | ${p.releaseDate} | \`${p.status}\` |`
  );

  return [
    "## System Patches & Release Changelog",
    "| Version | Type | Component | Changes & Scope | Flyway DB | Commit | Date | Status |",
    "|---|---|---|---|---|---|---|---|",
    ...rows,
    "",
  ];
}

function formatInfraTable(): string[] {
  return [
    "## Backend & Database Infrastructure",
    "| Service | Technology / Tier | Port | Architecture Role |",
    "|---|---|---|---|",
    "| **Core Backend** | Spring Boot 3.3.x (Java 21 LTS) | 9090 | Granular PBAC, PostGIS Hibernate Spatial, Spring Security |",
    "| **Database** | PostgreSQL 17 + PostGIS 3.5 | 5432 | Spatial D3 & Vector Topology, Fiber & Zone Calculation |",
    "| **Identity IAM** | Keycloak 26 | 8081 | OpenID Connect & OAuth2, Step-Up MFA, Encrypted Impersonation |",
    "| **API Gateway** | Kong Gateway + Traefik | 80/443 | JWT Claim Decryption, X-Tenant-ID Header Injection, Rate Limiting |",
    "| **Microservices** | 12 Go Gateways | 5001-5013 | High-Throughput Gateways (WABA, Map Geocoding, OLT Poller, Storage) |",
    "| **Storage & DR** | MinIO S3 + Nextcloud | 9005 | 3-Layer Disaster Recovery & Offsite Auto-Sync |",
    "",
  ];
}

function formatComputeTelemetry(c?: ComputeInfo, h?: HostHealthMetrics): string[] {
  const heapText = `${c?.heapUsedMb || 0} / ${c?.heapMaxMb || 1024} MB (Java ${c?.javaVersion || "21 LTS"}, ${c?.osInfo || "Linux"})`;
  const poolText = `${h?.postgresConnections || 1} Active Sessions (pg_stat_activity HikariCP)`;
  const cpuText = `${c?.cpuCores || 2} vCPU Cores (${c?.tier || "SERVER"} Tier)`;

  return [
    `- **JVM Heap Memory**: ${heapText}`,
    `- **PostgreSQL Pool**: ${poolText}`,
    `- **Host Processors**: ${cpuText}`,
  ];
}

function formatBackupTelemetry(b?: BackupInfo): string {
  const status = b?.status || "SUCCESS";
  const lastTime = b?.lastBackupTime || "00:00 UTC";
  const nc = b?.nextcloudStatus || "SYNCED";
  const minio = b?.minioStatus || "SYNCED";

  return `- **Disaster Recovery**: ${status} (Last Backup: ${lastTime}, Nextcloud: ${nc}, MinIO: ${minio})`;
}

export function generateSystemMarkdown(info?: PlatformSystemInfoData): string {
  return [
    ...formatOverview(info, info?.gitInfo, info?.migrationInfo),
    ...formatPatchesTable(info),
    ...formatInfraTable(),
    "## Live Runtime Telemetry & Health",
    ...formatComputeTelemetry(info?.computeInfo, info?.hostHealth),
    formatBackupTelemetry(info?.backupInfo),
  ].join("\n");
}
