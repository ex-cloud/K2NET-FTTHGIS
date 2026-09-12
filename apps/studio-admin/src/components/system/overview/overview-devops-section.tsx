

import {
  CheckCircle2,
  Clock,
  Database,
  DatabaseBackup,
  Github,
  HardDrive,
  Shield,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OverviewShell } from "./overview-shell";
import { OverviewDevOpsCard, OverviewStatusBadge } from "./overview-devops-card";
import type { DevOpsStats } from "./overview-types";
import type { GithubIntegrationState } from "@/hooks/useSystemOverviewData";

interface OverviewDevopsSectionProps {
  devopsStats: DevOpsStats | null;
  githubIntegrationStatus: GithubIntegrationState;
  postgresStatus: string;
  redisStatus: string;
  postgresConns: number;
  redisCacheHit: number;
  globalHealthState: "operational" | "warning" | "critical" | "loading";
  frontendGitBranch: string;
  frontendGitCommit: string;
  frontendGitCommitShort: string;
}

function GlobalStatusCard({
  globalHealthState,
}: {
  globalHealthState: OverviewDevopsSectionProps["globalHealthState"];
}) {
  const isOperational = globalHealthState === "operational";
  const isWarning = globalHealthState === "warning";
  const isLoading = globalHealthState === "loading";

  const dotColor = isOperational ? "bg-primary" : isWarning ? "bg-amber-500" : "bg-destructive";
  const statusText = isOperational
    ? "All Systems Operational"
    : isWarning
    ? "Partially Degraded"
    : isLoading
    ? "Checking..."
    : "Critical Issues";

  const description = isOperational
    ? "Identity, routing, and core services are healthy and responding normally."
    : "Some services may be degraded. Review the infrastructure map for impact details.";

  return (
    <OverviewDevOpsCard
      eyebrow="Global Status"
      title={
        <span className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full animate-pulse", dotColor)} />
          {statusText}
        </span>
      }
      description={description}
      icon={CheckCircle2}
      iconClassName="group-hover:text-primary"
      accentClassName="text-primary"
      href="/health"
      actionLabel="View Health Center"
      actionClassName="text-primary hover:text-primary/70"
    />
  );
}

function ComputeCard({ devopsStats }: { devopsStats: DevOpsStats | null }) {
  const compute = devopsStats?.compute;
  const maxGb = compute ? Math.round(compute.maxMemoryMb / 1024) : 0;
  const title = compute ? `${compute.tier} — ${compute.cpuCores} vCPU / ${maxGb} GB` : "Loading...";
  const memPercent = compute ? Math.min((compute.usedMemoryMb / compute.totalMemoryMb) * 100, 100) : 0;

  return (
    <OverviewDevOpsCard
      eyebrow="Compute"
      title={title}
      description={
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>JVM Memory Used</span>
            <span className="font-mono text-foreground">
              {compute ? `${compute.usedMemoryMb} MB / ${compute.totalMemoryMb} MB` : "—"}
            </span>
          </div>
          {compute && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-500"
                style={{ width: `${memPercent}%` }}
              />
            </div>
          )}
        </div>
      }
      icon={HardDrive}
      iconClassName="group-hover:text-sky-500"
      accentClassName="text-sky-400"
      href="/health"
      actionLabel="Inspect Runtime Metrics"
      actionClassName="text-sky-400 hover:text-sky-300"
    >
      {compute ? (
        <p className="mt-2 text-[9px] font-mono text-muted-foreground/60">
          Java {compute.javaVersion} • {compute.osInfo}
        </p>
      ) : null}
    </OverviewDevOpsCard>
  );
}

function GithubCard({
  githubIntegrationStatus,
  devopsStats,
  frontendGitBranch,
  frontendGitCommit,
  frontendGitCommitShort,
}: {
  githubIntegrationStatus: GithubIntegrationState;
  devopsStats: DevOpsStats | null;
  frontendGitBranch: string;
  frontendGitCommit: string;
  frontendGitCommitShort: string;
}) {
  const backendHref =
    devopsStats?.github?.backendRepo && devopsStats?.git?.commitFull
      ? `${devopsStats.github.backendRepo}/commit/${devopsStats.git.commitFull}`
      : "#";

  const frontendHref =
    frontendGitCommit !== "unknown"
      ? `https://github.com/ex-cloud/front_springboot_ftth_gis/commit/${frontendGitCommit}`
      : "#";

  return (
    <OverviewDevOpsCard
      eyebrow="Platform Deployments"
      title={
        <div className="flex items-center gap-2">
          <OverviewStatusBadge tone={githubIntegrationStatus.connected ? "success" : "neutral"}>
            {githubIntegrationStatus.connected ? "Active" : "Offline"}
          </OverviewStatusBadge>
          <span className="text-[10px] text-muted-foreground">GitHub Sync</span>
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
      <div className="mt-3 space-y-2 text-[11px] border-t border-border/40 pt-2.5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-semibold">Backend (API)</span>
            <a
              href={backendHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <GitBranch className="w-3 h-3 text-primary/80" />
              {devopsStats?.git?.branch || "main"} @ {devopsStats?.git?.commitShort || "..."}
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-semibold">Frontend (UI)</span>
            <a
              href={frontendHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <GitBranch className="w-3 h-3 text-primary/80" />
              {frontendGitBranch} @ {frontendGitCommitShort}
            </a>
          </div>
        </div>
      </div>
    </OverviewDevOpsCard>
  );
}

function DbCacheCard({
  postgresStatus,
  redisStatus,
  postgresConns,
  redisCacheHit,
}: {
  postgresStatus: string;
  redisStatus: string;
  postgresConns: number;
  redisCacheHit: number;
}) {
  const isHealthy = postgresStatus === "healthy" && redisStatus === "healthy";
  const isCritical = postgresStatus === "error" && redisStatus === "error";
  const tone = isHealthy ? "success" : isCritical ? "danger" : "warning";
  const label = isHealthy ? "Operational" : isCritical ? "Critical Outage" : "Degraded";

  return (
    <OverviewDevOpsCard
      eyebrow="Database & Cache Status"
      title={
        <div className="flex items-center gap-2">
          <OverviewStatusBadge tone={tone}>{label}</OverviewStatusBadge>
          <span className="text-[10px] text-muted-foreground">PostGIS &amp; Redis</span>
        </div>
      }
      description="Real-time performance indicators for active connections, Redis cache store hit ratios, and GIS extensions."
      icon={Database}
      iconClassName="group-hover:text-primary"
      accentClassName="text-primary"
      href="/health"
      actionLabel="View System Health"
      actionClassName="text-primary hover:text-primary/70"
    >
      <div className="mt-3 space-y-2 text-[11px] border-t border-border/40 pt-2.5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">DB Connections</span>
          <span className="font-mono text-foreground font-medium">{postgresConns} active</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Cache Hit Ratio</span>
          <span className="font-mono text-foreground font-medium">{redisCacheHit}%</span>
        </div>
      </div>
    </OverviewDevOpsCard>
  );
}

function MigrationCard({ devopsStats }: { devopsStats: DevOpsStats | null }) {
  const migration = devopsStats?.lastMigration;
  return (
    <OverviewDevOpsCard
      eyebrow="Last Migration"
      title={
        <div className="flex items-center gap-2">
          {migration?.version ? `V${migration.version}` : "Loading..."}
          {migration?.success ? <OverviewStatusBadge tone="success">Success</OverviewStatusBadge> : null}
        </div>
      }
      description={
        <div>
          <p className="truncate font-mono text-[10px] text-muted-foreground">
            {migration?.description || "—"}
          </p>
          <p className="mt-1 text-[9px] font-mono text-muted-foreground/60">
            Installed: {migration?.installedOn || "—"}
          </p>
        </div>
      }
      icon={Database}
      iconClassName="group-hover:text-teal-500"
      accentClassName="text-teal-400"
    />
  );
}

function BackupCard({ devopsStats }: { devopsStats: DevOpsStats | null }) {
  const backup = devopsStats?.lastBackup;
  const isNotConfigured = backup?.status === "NOT_CONFIGURED";
  const isSuccess = backup?.success;
  const tone = isSuccess ? "success" : isNotConfigured ? "neutral" : "warning";

  let titleNode: React.ReactNode = <span className="text-amber-500">Check Status</span>;
  if (isNotConfigured) {
    titleNode = <span className="text-muted-foreground">Not Configured</span>;
  } else if (isSuccess) {
    titleNode = (
      <span className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-primary" /> {backup?.lastBackupTime}
      </span>
    );
  }

  return (
    <OverviewDevOpsCard
      eyebrow="Last Backup"
      title={titleNode}
      description={
        <div className="flex items-center gap-1.5">
          <OverviewStatusBadge tone={tone}>{backup?.status || "UNKNOWN"}</OverviewStatusBadge>
          <span className="text-[9px] text-muted-foreground/50">PostgreSQL pg_dump</span>
        </div>
      }
      icon={DatabaseBackup}
      iconClassName="group-hover:text-rose-500"
      accentClassName="text-rose-400"
    />
  );
}

export function OverviewDevopsSection({
  devopsStats,
  githubIntegrationStatus,
  postgresStatus,
  redisStatus,
  postgresConns,
  redisCacheHit,
  globalHealthState,
  frontendGitBranch,
  frontendGitCommit,
  frontendGitCommitShort,
}: OverviewDevopsSectionProps) {
  return (
    <OverviewShell
      title={
        <span className="flex items-center gap-2">
          <Shield className="h-4.5 w-4.5 text-muted-foreground" /> DevOps &amp; Deployment Status
        </span>
      }
      description="Operational indicators for deployment health, compute capacity, backup state, and GitHub integration."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GlobalStatusCard globalHealthState={globalHealthState} />
        <ComputeCard devopsStats={devopsStats} />
        <GithubCard
          githubIntegrationStatus={githubIntegrationStatus}
          devopsStats={devopsStats}
          frontendGitBranch={frontendGitBranch}
          frontendGitCommit={frontendGitCommit}
          frontendGitCommitShort={frontendGitCommitShort}
        />
        <DbCacheCard
          postgresStatus={postgresStatus}
          redisStatus={redisStatus}
          postgresConns={postgresConns}
          redisCacheHit={redisCacheHit}
        />
        <MigrationCard devopsStats={devopsStats} />
        <BackupCard devopsStats={devopsStats} />
      </div>
    </OverviewShell>
  );
}
