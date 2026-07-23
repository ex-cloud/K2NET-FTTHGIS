"use client";

import { CheckCircle2, Clock, Database, DatabaseBackup, Github, HardDrive, Shield } from "lucide-react";
import { GitBranch } from "lucide-react";
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
        {/* Global Status */}
        <OverviewDevOpsCard
          eyebrow="Global Status"
          title={
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full animate-pulse",
                  globalHealthState === "operational"
                    ? "bg-primary"
                    : globalHealthState === "warning"
                    ? "bg-amber-500"
                    : "bg-red-500"
                )}
              />
              {globalHealthState === "operational"
                ? "All Systems Operational"
                : globalHealthState === "warning"
                ? "Partially Degraded"
                : globalHealthState === "loading"
                ? "Checking..."
                : "Critical Issues"}
            </span>
          }
          description={
            globalHealthState === "operational"
              ? "Identity, routing, and core services are healthy and responding normally."
              : "Some services may be degraded. Review the infrastructure map for impact details."
          }
          icon={CheckCircle2}
          iconClassName="group-hover:text-primary"
          accentClassName="text-primary"
          href="/health"
          actionLabel="View Health Center"
          actionClassName="text-primary hover:text-primary/70"
        />

        {/* Compute */}
        <OverviewDevOpsCard
          eyebrow="Compute"
          title={
            devopsStats
              ? `${devopsStats.compute.tier} — ${devopsStats.compute.cpuCores} vCPU / ${Math.round(devopsStats.compute.maxMemoryMb / 1024)} GB`
              : "Loading..."
          }
          description={
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>JVM Memory Used</span>
                <span className="font-mono text-foreground">
                  {devopsStats
                    ? `${devopsStats.compute.usedMemoryMb} MB / ${devopsStats.compute.totalMemoryMb} MB`
                    : "—"}
                </span>
              </div>
              {devopsStats && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-500"
                    style={{
                      width: `${Math.min((devopsStats.compute.usedMemoryMb / devopsStats.compute.totalMemoryMb) * 100, 100)}%`,
                    }}
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
          {devopsStats ? (
            <p className="mt-2 text-[9px] font-mono text-muted-foreground/60">
              Java {devopsStats.compute.javaVersion} • {devopsStats.compute.osInfo}
            </p>
          ) : null}
        </OverviewDevOpsCard>

        {/* GitHub */}
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
                  href={
                    devopsStats?.github?.backendRepo && devopsStats?.git?.commitFull
                      ? `${devopsStats.github.backendRepo}/commit/${devopsStats.git.commitFull}`
                      : "#"
                  }
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
                  href={
                    frontendGitCommit !== "unknown"
                      ? `https://github.com/ex-cloud/front_springboot_ftth_gis/commit/${frontendGitCommit}`
                      : "#"
                  }
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

        {/* DB & Cache */}
        <OverviewDevOpsCard
          eyebrow="Database & Cache Status"
          title={
            <div className="flex items-center gap-2">
              <OverviewStatusBadge
                tone={
                  postgresStatus === "healthy" && redisStatus === "healthy"
                    ? "success"
                    : postgresStatus === "error" && redisStatus === "error"
                    ? "danger"
                    : "warning"
                }
              >
                {postgresStatus === "healthy" && redisStatus === "healthy"
                  ? "Operational"
                  : postgresStatus === "error" && redisStatus === "error"
                  ? "Critical Outage"
                  : "Degraded"}
              </OverviewStatusBadge>
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

        {/* Last Migration */}
        <OverviewDevOpsCard
          eyebrow="Last Migration"
          title={
            <div className="flex items-center gap-2">
              {devopsStats?.lastMigration?.version ? `V${devopsStats.lastMigration.version}` : "Loading..."}
              {devopsStats?.lastMigration?.success ? (
                <OverviewStatusBadge tone="success">Success</OverviewStatusBadge>
              ) : null}
            </div>
          }
          description={
            <div>
              <p className="truncate font-mono text-[10px] text-muted-foreground">
                {devopsStats?.lastMigration?.description || "—"}
              </p>
              <p className="mt-1 text-[9px] font-mono text-muted-foreground/60">
                Installed: {devopsStats?.lastMigration?.installedOn || "—"}
              </p>
            </div>
          }
          icon={Database}
          iconClassName="group-hover:text-teal-500"
          accentClassName="text-teal-400"
        />

        {/* Last Backup */}
        <OverviewDevOpsCard
          eyebrow="Last Backup"
          title={
            devopsStats?.lastBackup?.status === "NOT_CONFIGURED" ? (
              <span className="text-muted-foreground">Not Configured</span>
            ) : devopsStats?.lastBackup?.success ? (
              <span className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-primary" /> {devopsStats.lastBackup.lastBackupTime}
              </span>
            ) : (
              <span className="text-amber-500">Check Status</span>
            )
          }
          description={
            <div className="flex items-center gap-1.5">
              <OverviewStatusBadge
                tone={
                  devopsStats?.lastBackup?.success
                    ? "success"
                    : devopsStats?.lastBackup?.status === "NOT_CONFIGURED"
                    ? "neutral"
                    : "warning"
                }
              >
                {devopsStats?.lastBackup?.status || "UNKNOWN"}
              </OverviewStatusBadge>
              <span className="text-[9px] text-muted-foreground/50">PostgreSQL pg_dump</span>
            </div>
          }
          icon={DatabaseBackup}
          iconClassName="group-hover:text-rose-500"
          accentClassName="text-rose-400"
        />
      </div>
    </OverviewShell>
  );
}
