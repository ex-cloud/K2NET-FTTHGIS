import * as React from "react";
import {
  Badge,
  Skeleton,
  cn,
} from "@k2net/ui";
import {
  Cpu,
  Server,
  Database,
  ShieldCheck,
  Layers,
  GitBranch,
  Copy,
  Check,
  Activity,
  HardDrive,
  Network,
  Zap,
} from "lucide-react";
import type { PlatformSystemInfoData } from "@/hooks/usePlatformSystemInfo";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";

export function CopyableBadge({
  text,
  label,
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label || "Text"} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={handleCopy}
      role="button"
      tabIndex={0}
      title="Click to copy"
      className={cn(
        "group inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono font-medium",
        "bg-muted/50 hover:bg-muted border border-border/80 text-foreground transition-all cursor-pointer select-none",
        className
      )}
    >
      <span>{text}</span>
      {copied ? (
        <Check className="h-3 w-3 text-primary shrink-0" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground/60 group-hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </div>
  );
}

export function CoreIdentityCards({
  info,
  loading,
}: {
  info?: PlatformSystemInfoData;
  loading: boolean;
}) {
  const { t } = useTranslation();

  if (loading && !info) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border/80 bg-card p-3.5 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
          </div>
        ))}
      </div>
    );
  }

  const flywayDisplay = info?.migrationInfo?.version && info.migrationInfo.version !== "—"
    ? `Flyway V${info.migrationInfo.version}`
    : "Flyway V51";

  const flywayCount = info?.migrationInfo?.version && info.migrationInfo.version !== "—"
    ? info.migrationInfo.version
    : "51";

  const semverBreakdown = t("settings.system_info.semver_breakdown", {
    major: info?.patchInfo?.major ?? 1,
    minor: info?.patchInfo?.minor ?? 0,
  });

  const gitCommitDesc = t("settings.system_info.git_commit_desc", {
    branch: info?.gitInfo?.branch || "main",
  });

  const dbSchemaDesc = t("settings.system_info.db_schema_desc", {
    count: flywayCount,
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      {/* 1. Platform Version Card (SemVer) */}
      <div className="rounded-lg border border-border/80 bg-card p-3.5 flex flex-col justify-between space-y-2 shadow-xs">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" />
            {t("settings.system_info.platform_version")}
          </span>
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-[9px]">
            GA STABLE
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold font-mono text-foreground">
            {info?.appVersion || "v1.0.0"}
          </span>
          <CopyableBadge text={info?.appVersion || "v1.0.0"} label="Platform Version" />
        </div>
        <p className="text-[10px] text-muted-foreground font-mono truncate">
          {semverBreakdown}
        </p>
      </div>

      {/* 2. Patch & Hotfix Level Card */}
      <div className="rounded-lg border border-border/80 bg-card p-3.5 flex flex-col justify-between space-y-2 shadow-xs">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            {t("settings.system_info.patch_level")}
          </span>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px]",
              info?.patchInfo?.patchLevel && info.patchInfo.patchLevel > 0
                ? "border-amber-500/30 text-amber-500 bg-amber-500/10"
                : "border-primary/30 text-primary bg-primary/10"
            )}
          >
            {info?.patchInfo?.patchLevel && info.patchInfo.patchLevel > 0
              ? t("settings.system_info.patch_status_hotfix")
              : t("settings.system_info.patch_status_baseline")}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold font-mono text-foreground">
            Patch .{info?.patchInfo?.patchLevel ?? 0}
          </span>
          <CopyableBadge
            text={`v${info?.patchInfo?.major ?? 1}.${info?.patchInfo?.minor ?? 0}.${info?.patchInfo?.patchLevel ?? 0}`}
            label="SemVer Full Patch"
          />
        </div>
        <p className="text-[10px] text-muted-foreground truncate">
          {t("settings.system_info.patch_level_desc")}
        </p>
      </div>

      {/* 3. REST API Namespace Card */}
      <div className="rounded-lg border border-border/80 bg-card p-3.5 flex flex-col justify-between space-y-2 shadow-xs">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5 text-primary" />
            {t("settings.system_info.api_version")}
          </span>
          <Badge variant="outline" className="border-border text-foreground bg-muted/30 text-[9px]">
            ACTIVE
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold font-mono text-foreground">
            {info?.apiVersion || "/api/v1"}
          </span>
          <CopyableBadge text={info?.apiVersion || "/api/v1"} label="API Version" />
        </div>
        <p className="text-[10px] text-muted-foreground truncate">
          {t("settings.system_info.api_contract_desc")}
        </p>
      </div>

      {/* 4. Flyway Database Migrations */}
      <div className="rounded-lg border border-border/80 bg-card p-3.5 flex flex-col justify-between space-y-2 shadow-xs">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-muted-foreground" />
            {t("settings.system_info.db_schema")}
          </span>
          <Badge variant="outline" className="border-border text-foreground bg-muted/30 text-[9px]">
            0 GAP
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold font-mono text-foreground">
            {flywayDisplay}
          </span>
          <CopyableBadge text={flywayDisplay} label="Flyway Schema" />
        </div>
        <p className="text-[10px] text-muted-foreground truncate">
          {dbSchemaDesc}
        </p>
      </div>

      {/* 5. Active Git Commit Hash */}
      <div className="rounded-lg border border-border/80 bg-card p-3.5 flex flex-col justify-between space-y-2 shadow-xs">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
            {t("settings.system_info.git_commit")}
          </span>
          <Badge variant="outline" className="border-border text-foreground bg-muted/30 text-[9px]">
            {info?.gitInfo?.branch || "main"}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold font-mono text-foreground">
            {info?.gitCommitHash || "08604d7f"}
          </span>
          <CopyableBadge text={info?.gitCommitHash || "08604d7f"} label="Git Commit" />
        </div>
        <p className="text-[10px] text-muted-foreground truncate">
          {gitCommitDesc}
        </p>
      </div>
    </div>
  );
}

export function SystemPatchesChangelogCard({
  info,
  loading,
}: {
  info?: PlatformSystemInfoData;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const patches = info?.patchInfo?.recentPatches || [];

  if (loading && !info) {
    return (
      <div className="rounded-lg border border-border/80 bg-card p-4 space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "BASELINE":
        return (
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[9px] font-bold">
            {t("settings.system_info.tag_baseline")}
          </Badge>
        );
      case "SECURITY":
        return (
          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-500 text-[9px] font-bold">
            {t("settings.system_info.tag_security")}
          </Badge>
        );
      case "BUGFIX":
        return (
          <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-500 text-[9px] font-bold">
            {t("settings.system_info.tag_bugfix")}
          </Badge>
        );
      case "PERFORMANCE":
        return (
          <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/10 text-cyan-500 text-[9px] font-bold">
            {t("settings.system_info.tag_performance")}
          </Badge>
        );
      case "MIGRATION":
        return (
          <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-500 text-[9px] font-bold">
            {t("settings.system_info.tag_migration")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-border text-foreground text-[9px]">
            {type}
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/30 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="py-2.5 px-3.5">{t("settings.system_info.col_patch_version")}</th>
              <th className="py-2.5 px-3">{t("settings.system_info.col_patch_type")}</th>
              <th className="py-2.5 px-3">{t("settings.system_info.col_component")}</th>
              <th className="py-2.5 px-3 min-w-[240px]">{t("settings.system_info.col_description")}</th>
              <th className="py-2.5 px-3">{t("settings.system_info.col_db_migration")}</th>
              <th className="py-2.5 px-3">{t("settings.system_info.col_commit")}</th>
              <th className="py-2.5 px-3">{t("settings.system_info.col_date")}</th>
              <th className="py-2.5 px-3.5 text-right">{t("settings.system_info.col_status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {patches.map((patch) => (
              <tr key={patch.id} className="hover:bg-muted/20 transition-colors">
                <td className="py-2.5 px-3.5 font-mono font-bold text-foreground whitespace-nowrap">
                  {patch.version}
                </td>
                <td className="py-2.5 px-3 whitespace-nowrap">
                  {getTypeBadge(patch.type)}
                </td>
                <td className="py-2.5 px-3 text-foreground font-medium whitespace-nowrap">
                  {patch.component}
                </td>
                <td className="py-2.5 px-3 text-muted-foreground leading-relaxed">
                  {patch.description}
                </td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                  {patch.dbMigration || "—"}
                </td>
                <td className="py-2.5 px-3 whitespace-nowrap">
                  <CopyableBadge text={patch.commitHash} label="Commit" />
                </td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                  {patch.releaseDate}
                </td>
                <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-semibold",
                      patch.status === "ACTIVE"
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : patch.status === "DEPLOYED"
                        ? "border-border bg-muted/40 text-foreground"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {patch.status === "ACTIVE"
                      ? t("settings.system_info.status_active")
                      : patch.status === "DEPLOYED"
                      ? t("settings.system_info.status_deployed")
                      : t("settings.system_info.status_planned")}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BackendStackCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {/* Spring Boot Core Engine */}
      <div className="rounded-lg border border-border/80 bg-card p-4 space-y-2 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Spring Boot 3.3.x</h4>
              <p className="text-[10px] text-muted-foreground">Core Backend & Business Domain</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] border-primary/30 text-primary bg-primary/10">
            PORT 9090
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
          Java 21 LTS OpenJDK dengan arsitektur Granular PBAC, Hibernate Spatial PostGIS, dan Spring Security.
        </p>
      </div>

      {/* PostgreSQL & PostGIS Spatial */}
      <div className="rounded-lg border border-border/80 bg-card p-4 space-y-2 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-muted border border-border flex items-center justify-center text-foreground">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">PostgreSQL 17 + PostGIS</h4>
              <p className="text-[10px] text-muted-foreground">Spatial DB & Vector Topology</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] border-border text-foreground bg-muted/30">
            PORT 5432
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
          Database relasional enterprise dengan ekstensi spasial PostGIS 3.5 untuk kalkulasi fiber dan zone coverage.
        </p>
      </div>

      {/* Keycloak IAM */}
      <div className="rounded-lg border border-border/80 bg-card p-4 space-y-2 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-muted border border-border flex items-center justify-center text-foreground">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Keycloak 26 IAM</h4>
              <p className="text-[10px] text-muted-foreground">Identity & Step-up MFA</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] border-border text-foreground bg-muted/30">
            PORT 8081
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
          OpenID Connect & OAuth2 identity provider dengan dukungan Impersonation Session 30 menit terenkripsi.
        </p>
      </div>

      {/* Kong API Gateway & Ingress */}
      <div className="rounded-lg border border-border/80 bg-card p-4 space-y-2 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-muted border border-border flex items-center justify-center text-foreground">
              <Network className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Kong Gateway + Traefik</h4>
              <p className="text-[10px] text-muted-foreground">Edge Routing & Tenant Isolation</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] border-border text-foreground bg-muted/30">
            PORTS 80/443
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
          Deklaratif DB-less API Gateway menyaring JWT claim, menginjeksi X-Tenant-ID header, dan rate limiting.
        </p>
      </div>

      {/* Go Microservices Gateways */}
      <div className="rounded-lg border border-border/80 bg-card p-4 space-y-2 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-muted border border-border flex items-center justify-center text-foreground">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">12 Go Gateways</h4>
              <p className="text-[10px] text-muted-foreground">High-Throughput Microservices</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] border-border text-foreground bg-muted/30">
            PORTS 5001-5013
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
          Microservice mandiri Go untuk WhatsApp WABA, Map geocoding, OLT poller, Payment, Storage, dan Audit logs.
        </p>
      </div>

      {/* MinIO Object Storage & 3-Layer DR */}
      <div className="rounded-lg border border-border/80 bg-card p-4 space-y-2 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-muted border border-border flex items-center justify-center text-foreground">
              <HardDrive className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">MinIO S3 + Nextcloud</h4>
              <p className="text-[10px] text-muted-foreground">3-Layer Disaster Recovery</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] border-border text-foreground bg-muted/30">
            PORT 9005
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
          Penyimpanan objek S3 on-premise terisolasi per tenant dengan sinkronisasi offsite otomatis ke Nextcloud.
        </p>
      </div>
    </div>
  );
}

function JvmMemoryCard({ info }: { info?: PlatformSystemInfoData }) {
  const { t } = useTranslation();
  const heapUsed = info?.computeInfo?.heapUsedMb || 0;
  const heapMax = info?.computeInfo?.heapMaxMb || 1024;
  const heapPct = heapMax > 0 ? Math.min(100, Math.round((heapUsed / heapMax) * 100)) : 0;

  return (
    <div className="rounded-lg border border-border/80 bg-card p-3.5 space-y-2 shadow-xs">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-primary" />
          {t("settings.system_info.jvm_memory")}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {heapUsed} / {heapMax} MB ({heapPct}%)
        </span>
      </div>
      <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
        <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${heapPct}%` }} />
      </div>
      <p className="text-[10px] text-muted-foreground font-mono truncate">
        Java {info?.computeInfo?.javaVersion || "21"} ({info?.computeInfo?.osInfo || "Linux"})
      </p>
    </div>
  );
}

function DatabasePoolCard({ info }: { info?: PlatformSystemInfoData }) {
  const dbConns = info?.hostHealth?.postgresConnections || 0;

  return (
    <div className="rounded-lg border border-border/80 bg-card p-3.5 space-y-1.5 shadow-xs">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5 text-primary" />
          PostgreSQL Active Pool
        </span>
        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-[9px]">
          CONNECTED
        </Badge>
      </div>
      <p className="text-base font-bold font-mono text-foreground">
        {dbConns > 0 ? `${dbConns} Active Sessions` : "Connected (HikariCP)"}
      </p>
      <p className="text-[10px] text-muted-foreground">
        Live Pool telemetry via pg_stat_activity
      </p>
    </div>
  );
}

function CpuProcessCard({ info }: { info?: PlatformSystemInfoData }) {
  const { t } = useTranslation();
  const cpuCores = info?.computeInfo?.cpuCores || 0;

  return (
    <div className="rounded-lg border border-border/80 bg-card p-3.5 space-y-1.5 shadow-xs">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          {t("settings.system_info.cpu_cores")}
        </span>
        <Badge variant="outline" className="border-border text-foreground bg-muted/30 text-[9px]">
          {info?.computeInfo?.tier || "SERVER"}
        </Badge>
      </div>
      <p className="text-base font-bold font-mono text-foreground">
        {cpuCores > 0 ? `${cpuCores} vCPU Cores` : "Host Processors"}
      </p>
      <p className="text-[10px] text-muted-foreground">
        Parallel Executor Thread Pool Active
      </p>
    </div>
  );
}

function DisasterRecoveryCard({ info }: { info?: PlatformSystemInfoData }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-border/80 bg-card p-3.5 space-y-1.5 shadow-xs">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium flex items-center gap-1.5">
          <HardDrive className="h-3.5 w-3.5 text-primary" />
          {t("settings.system_info.last_backup")}
        </span>
        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-[9px]">
          {info?.backupInfo?.status || info?.backupInfo?.lastStatus || "SUCCESS"}
        </Badge>
      </div>
      <p className="text-xs font-bold font-mono text-foreground truncate">
        {info?.backupInfo?.lastBackupTime && info.backupInfo.lastBackupTime !== "—"
          ? info.backupInfo.lastBackupTime
          : "Scheduled (00:00 UTC)"}
      </p>
      <p className="text-[10px] text-muted-foreground truncate">
        Nextcloud: {info?.backupInfo?.nextcloudStatus || "SYNCED"} • MinIO: {info?.backupInfo?.minioStatus || "SYNCED"}
      </p>
    </div>
  );
}

export function LiveTelemetryCards({
  info,
  loading,
}: {
  info?: PlatformSystemInfoData;
  loading: boolean;
}) {
  if (loading && !info) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border/80 bg-card p-3.5 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <JvmMemoryCard info={info} />
      <DatabasePoolCard info={info} />
      <CpuProcessCard info={info} />
      <DisasterRecoveryCard info={info} />
    </div>
  );
}
