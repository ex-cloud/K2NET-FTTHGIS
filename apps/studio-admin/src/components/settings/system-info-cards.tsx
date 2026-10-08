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
  HardDrive,
  Network,
  Activity,
  Copy,
  Check,
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
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(
      t("settings.system_info.toast_copied_text", {
        label: label || t("settings.system_info.commit_hash_label"),
      })
    );
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={handleCopy}
      role="button"
      tabIndex={0}
      title={t("settings.system_info.click_to_copy")}
      className={cn(
        "group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono font-medium",
        "bg-muted/40 hover:bg-muted/80 border border-border/80 text-foreground transition-all cursor-pointer select-none",
        className
      )}
    >
      <span>{text}</span>
      {copied ? (
        <Check className="size-3 text-primary shrink-0" />
      ) : (
        <Copy className="size-3 text-muted-foreground/60 group-hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </div>
  );
}

export function SystemStatusStrip({
  info,
  loading,
}: {
  info?: PlatformSystemInfoData;
  loading: boolean;
}) {
  const { t } = useTranslation();

  if (loading && !info) {
    return <Skeleton className="h-10 w-full rounded-lg" />;
  }

  const flywayDisplay =
    info?.migrationInfo?.version && info.migrationInfo.version !== "—"
      ? `Flyway V${info.migrationInfo.version}`
      : "Flyway V51";

  const patchLevel = info?.patchInfo?.patchLevel ?? 0;

  return (
    <div className="mt-3 px-3.5 py-2 rounded-lg bg-card border border-border/80 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 text-xs font-mono text-muted-foreground shadow-xs select-none">
      {/* Platform Version */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground/80 font-sans text-xs">
          {t("settings.system_info.strip_platform")}:
        </span>
        <span className="font-semibold text-foreground">
          {info?.appVersion || "v1.0.0"}
        </span>
        <Badge
          variant="outline"
          className="border-primary/30 text-primary bg-primary/10 text-[9px] font-sans font-medium px-1.5 py-0"
        >
          {t("settings.system_info.ga_stable")}
        </Badge>
      </div>

      <div className="hidden md:block h-3.5 w-px bg-border/80 shrink-0" />

      {/* Hotfix Level */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground/80 font-sans text-xs">
          {t("settings.system_info.strip_hotfix")}:
        </span>
        <span className="text-foreground font-medium">Patch .{patchLevel}</span>
        <Badge
          variant="outline"
          className="border-border text-foreground bg-muted/30 text-[9px] font-sans font-medium px-1.5 py-0"
        >
          {patchLevel > 0
            ? t("settings.system_info.patch_status_hotfix")
            : t("settings.system_info.patch_status_baseline")}
        </Badge>
      </div>

      <div className="hidden md:block h-3.5 w-px bg-border/80 shrink-0" />

      {/* REST API */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground/80 font-sans text-xs">
          {t("settings.system_info.strip_api")}:
        </span>
        <span className="text-primary font-semibold font-mono">
          {info?.apiVersion || "/api/v1"}
        </span>
        <Badge
          variant="outline"
          className="border-border text-foreground bg-muted/30 text-[9px] font-sans font-medium px-1.5 py-0"
        >
          {t("settings.system_info.status_active")}
        </Badge>
      </div>

      <div className="hidden md:block h-3.5 w-px bg-border/80 shrink-0" />

      {/* Flyway Migrations */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground/80 font-sans text-xs">
          {t("settings.system_info.strip_db")}:
        </span>
        <span className="text-foreground font-medium">{flywayDisplay}</span>
        <span className="text-[10px] text-muted-foreground/70">
          ({t("settings.system_info.strip_zero_gap")})
        </span>
      </div>

      <div className="hidden md:block h-3.5 w-px bg-border/80 shrink-0" />

      {/* Git Commit */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground/80 font-sans text-xs">
          {t("settings.system_info.strip_commit")}:
        </span>
        <span className="text-foreground font-medium">
          {info?.gitCommitHash || "—"}
        </span>
        <Badge
          variant="outline"
          className="border-border text-muted-foreground bg-muted/20 text-[9px] font-sans uppercase px-1.5 py-0"
        >
          {info?.gitInfo?.branch || "main"}
        </Badge>
        {info?.gitCommitHash && info.gitCommitHash !== "—" && (
          <CopyableBadge
            text={info.gitCommitHash}
            label={t("settings.system_info.commit_hash_label")}
            className="py-0.5 px-1.5 text-[10px]"
          />
        )}
      </div>
    </div>
  );
}

export function BackendStackCards() {
  const { t } = useTranslation();

  const services = [
    {
      title: t("settings.system_info.spring_boot_title"),
      sub: t("settings.system_info.spring_boot_sub"),
      port: "PORT 9090",
      icon: Server,
      chips: ["Java 21 LTS", "Granular PBAC", "Hibernate Spatial", "Spring Sec"],
    },
    {
      title: t("settings.system_info.postgres_title"),
      sub: t("settings.system_info.postgres_sub"),
      port: "PORT 5432",
      icon: Database,
      chips: ["PostGIS 3.5", "Vector Topology", "Fiber Calculation", "HikariCP"],
    },
    {
      title: t("settings.system_info.keycloak_title"),
      sub: t("settings.system_info.keycloak_sub"),
      port: "PORT 8081",
      icon: ShieldCheck,
      chips: ["OpenID Connect", "Step-up MFA", "Encrypted Session", "OAuth2"],
    },
    {
      title: t("settings.system_info.kong_title"),
      sub: t("settings.system_info.kong_sub"),
      port: "PORTS 80/443",
      icon: Network,
      chips: ["Edge Routing", "JWT Claims", "X-Tenant-ID", "Rate Limiting"],
    },
    {
      title: t("settings.system_info.go_gateways_title"),
      sub: t("settings.system_info.go_gateways_sub"),
      port: "PORTS 5001-5013",
      icon: Activity,
      chips: ["WhatsApp WABA", "Map Geocoding", "OLT Poller", "Storage & Audit"],
    },
    {
      title: t("settings.system_info.minio_title"),
      sub: t("settings.system_info.minio_sub"),
      port: "PORT 9005",
      icon: HardDrive,
      chips: ["S3 On-Premise", "Nextcloud Offsite", "3-Layer DR", "Daily Backup"],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
      {services.map((svc, idx) => {
        const Icon = svc.icon;
        return (
          <div
            key={idx}
            className="rounded-lg border border-border/80 bg-card p-3 space-y-2 shadow-xs hover:border-border transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-6 w-6 rounded bg-muted/60 flex items-center justify-center border border-border/60 text-foreground shrink-0">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="text-xs font-semibold text-foreground truncate">{svc.title}</h4>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono px-1.5 py-0 shrink-0 border-border text-foreground bg-muted/30"
                >
                  {svc.port}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate pt-1">{svc.sub}</p>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {svc.chips.map((chip, cIdx) => (
                <span
                  key={cIdx}
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground border border-border/50 select-none"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function JvmMemoryCard({ info }: { info?: PlatformSystemInfoData }) {
  const { t } = useTranslation();
  const heapUsed = info?.computeInfo?.heapUsedMb || 0;
  const heapMax = info?.computeInfo?.heapMaxMb || 1024;
  const heapPct = heapMax > 0 ? Math.min(100, Math.round((heapUsed / heapMax) * 100)) : 0;

  return (
    <div className="h-[88px] rounded-lg border border-border/80 bg-card p-3 flex flex-col justify-between shadow-xs">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-foreground" />
          {t("settings.system_info.jvm_memory")}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {heapUsed}/{heapMax} MB ({heapPct}%)
        </span>
      </div>
      <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-300"
          style={{ width: `${heapPct}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground font-mono truncate">
        Java {info?.computeInfo?.javaVersion || "21"} ({info?.computeInfo?.osInfo || "Linux"})
      </p>
    </div>
  );
}

function DatabasePoolCard({ info }: { info?: PlatformSystemInfoData }) {
  const { t } = useTranslation();
  const dbConns = info?.hostHealth?.postgresConnections || 0;

  return (
    <div className="h-[88px] rounded-lg border border-border/80 bg-card p-3 flex flex-col justify-between shadow-xs">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5 text-foreground" />
          {t("settings.system_info.postgres_pool_title")}
        </span>
        <Badge variant="outline" className="border-border text-foreground bg-muted/30 text-[9px] px-1.5 py-0">
          {t("settings.system_info.status_connected")}
        </Badge>
      </div>
      <p className="text-sm font-bold font-mono text-foreground">
        {dbConns > 0
          ? t("settings.system_info.active_sessions_count", { count: dbConns })
          : t("settings.system_info.connected_hikaricp")}
      </p>
      <p className="text-[10px] text-muted-foreground">
        {t("settings.system_info.active_sessions_desc")}
      </p>
    </div>
  );
}

function CpuProcessCard({ info }: { info?: PlatformSystemInfoData }) {
  const { t } = useTranslation();
  const cpuCores = info?.computeInfo?.cpuCores || 0;

  return (
    <div className="h-[88px] rounded-lg border border-border/80 bg-card p-3 flex flex-col justify-between shadow-xs">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-foreground" />
          {t("settings.system_info.cpu_cores")}
        </span>
        <Badge variant="outline" className="border-border text-foreground bg-muted/30 text-[9px] px-1.5 py-0">
          {info?.computeInfo?.tier || "SERVER"}
        </Badge>
      </div>
      <p className="text-sm font-bold font-mono text-foreground">
        {cpuCores > 0
          ? t("settings.system_info.vcpu_cores_count", { count: cpuCores })
          : t("settings.system_info.host_processors")}
      </p>
      <p className="text-[10px] text-muted-foreground">
        {t("settings.system_info.thread_pool_desc")}
      </p>
    </div>
  );
}

function DisasterRecoveryCard({ info }: { info?: PlatformSystemInfoData }) {
  const { t } = useTranslation();
  const backupTime =
    info?.backupInfo?.lastBackupTime && info.backupInfo.lastBackupTime !== "—"
      ? info.backupInfo.lastBackupTime
      : t("settings.system_info.scheduled_backup_time");

  const ncOk = (info?.backupInfo?.nextcloudStatus || "SYNCED") === "SYNCED";
  const minioOk = (info?.backupInfo?.minioStatus || "SYNCED") === "SYNCED";

  return (
    <div className="h-[88px] rounded-lg border border-border/80 bg-card p-3 flex flex-col justify-between shadow-xs">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium flex items-center gap-1.5">
          <HardDrive className="h-3.5 w-3.5 text-foreground" />
          {t("settings.system_info.last_backup")}
        </span>
        <Badge variant="outline" className="border-border text-foreground bg-muted/30 text-[9px] px-1.5 py-0">
          {info?.backupInfo?.status || info?.backupInfo?.lastStatus || "SUCCESS"}
        </Badge>
      </div>
      <p className="text-xs font-bold font-mono text-foreground truncate">
        {backupTime}
      </p>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className={cn("size-1.5 rounded-full", ncOk ? "bg-primary" : "bg-destructive")} />
          Nextcloud: {info?.backupInfo?.nextcloudStatus || "SYNCED"}
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <span className={cn("size-1.5 rounded-full", minioOk ? "bg-primary" : "bg-destructive")} />
          MinIO: {info?.backupInfo?.minioStatus || "SYNCED"}
        </span>
      </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[88px] rounded-lg border border-border/80 bg-card p-3 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-28" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
      <JvmMemoryCard info={info} />
      <DatabasePoolCard info={info} />
      <CpuProcessCard info={info} />
      <DisasterRecoveryCard info={info} />
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
      <div className="rounded-lg border border-border/80 bg-card p-3 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "BASELINE":
        return (
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0"
          >
            {t("settings.system_info.tag_baseline")}
          </Badge>
        );
      case "SECURITY":
        return (
          <Badge
            variant="outline"
            className="border-border bg-muted/60 text-foreground text-[9px] font-bold px-1.5 py-0"
          >
            {t("settings.system_info.tag_security")}
          </Badge>
        );
      case "BUGFIX":
        return (
          <Badge
            variant="outline"
            className="border-border bg-muted/40 text-foreground text-[9px] font-medium px-1.5 py-0"
          >
            {t("settings.system_info.tag_bugfix")}
          </Badge>
        );
      case "PERFORMANCE":
        return (
          <Badge
            variant="outline"
            className="border-border bg-muted/40 text-foreground text-[9px] font-medium px-1.5 py-0"
          >
            {t("settings.system_info.tag_performance")}
          </Badge>
        );
      case "MIGRATION":
        return (
          <Badge
            variant="outline"
            className="border-border bg-muted/40 text-foreground text-[9px] font-medium px-1.5 py-0"
          >
            {t("settings.system_info.tag_migration")}
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-border text-foreground bg-muted/30 text-[9px] px-1.5 py-0"
          >
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
              <th className="py-2 px-3">{t("settings.system_info.col_patch_version")}</th>
              <th className="py-2 px-3">{t("settings.system_info.col_patch_type")}</th>
              <th className="py-2 px-3">{t("settings.system_info.col_component")}</th>
              <th className="py-2 px-3">{t("settings.system_info.col_description")}</th>
              <th className="py-2 px-3">{t("settings.system_info.col_db_migration")}</th>
              <th className="py-2 px-3">{t("settings.system_info.col_commit")}</th>
              <th className="py-2 px-3">{t("settings.system_info.col_date")}</th>
              <th className="py-2 px-3 text-right">{t("settings.system_info.col_status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {patches.map((patch) => (
              <tr key={patch.id} className="hover:bg-muted/20 transition-colors">
                <td className="py-2 px-3 font-mono font-bold text-foreground whitespace-nowrap">
                  {patch.version}
                </td>
                <td className="py-2 px-3 whitespace-nowrap">
                  {getTypeBadge(patch.type)}
                </td>
                <td className="py-2 px-3 text-foreground font-medium whitespace-nowrap">
                  {patch.component}
                </td>
                <td className="py-2 px-3 text-muted-foreground max-w-[280px] truncate" title={patch.description}>
                  {patch.description}
                </td>
                <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                  {patch.dbMigration || "—"}
                </td>
                <td className="py-2 px-3 whitespace-nowrap">
                  <CopyableBadge
                    text={patch.commitHash}
                    label={t("settings.system_info.commit_hash_label")}
                    className="py-0.5 px-1.5 text-[10px]"
                  />
                </td>
                <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                  {patch.releaseDate}
                </td>
                <td className="py-2 px-3 text-right whitespace-nowrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-semibold px-1.5 py-0",
                      patch.status === "ACTIVE"
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : patch.status === "DEPLOYED"
                        ? "border-border bg-muted/30 text-foreground"
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

/**
 * Backward compatibility alias if needed
 * @deprecated Use SystemStatusStrip instead
 */
export const CoreIdentityCards = SystemStatusStrip;

