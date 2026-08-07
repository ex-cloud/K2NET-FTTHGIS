"use client";

import React from "react";
import Link from "next/link";
import { Badge, Button, PageLayout } from "@k2net/ui";
import { CalendarClock, RefreshCw, XCircle, ExternalLink } from "lucide-react";
import { useSchedulerStatus } from "@/hooks/useSchedulerStatus";
import { SchedulerKpiCards } from "./components/scheduler-kpi-cards";
import { SchedulerJobsTable } from "./components/scheduler-jobs-table";
import { SchedulerArtifactsTable } from "./components/scheduler-artifacts-table";

// ─── Security: ALLOWED script keys (IaC scripts must NEVER appear here) ───────
const SCRIPT_WHITELIST = new Set([
  "backup",
  "backup-minio",
  "backup-code",
  "backup-docker",
  "backup-secrets",
  "archive-audit",
  "sync-nextcloud",
  "cleanup",
]);

export default function SchedulerPage() {
  const { jobs, artifacts, devopsBackupInfo, loading, error, refresh, triggerJob } = useSchedulerStatus();
  const hasFailedJobs = jobs.some((j) => j.lastStatus === "FAILED");

  const formatTimeSub = (timeStr?: string, prefix = "") => {
    if (!timeStr || timeStr === "—" || !timeStr.includes(" ")) return `${prefix}Today 00:00 WIB`;
    const parts = timeStr.split(" ");
    return `${prefix}Today ${parts[1] || parts[0]} WIB`;
  };

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <CalendarClock className="h-5 w-5 text-primary" />
            System Jobs &amp; Cron Scheduler
            {hasFailedJobs && (
              <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <XCircle className="w-3 h-3" /> FAILURES DETECTED
              </span>
            )}
          </h1>
          <p className="text-xs text-foreground/75 dark:text-muted-foreground">
            Automated job scheduling, on-demand execution, and backup artifact validation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="border-primary/20 bg-primary/10 text-primary text-[10px]">
            {loading ? "LOADING…" : "LIVE DATA"}
          </Badge>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <SchedulerKpiCards
        jobs={jobs}
        devopsBackupInfo={devopsBackupInfo}
        loading={loading}
        formatTimeSub={formatTimeSub}
      />

      {/* ── Section A: Cron Jobs Monitor ── */}
      <SchedulerJobsTable
        jobs={jobs}
        triggerJob={triggerJob}
        scriptWhitelist={SCRIPT_WHITELIST}
      />

      {/* ── Section B: Backup Artifacts Explorer ── */}
      <SchedulerArtifactsTable
        artifacts={artifacts}
        loading={loading}
      />

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-1 pb-4">
        <p className="text-xs text-foreground/75 dark:text-muted-foreground flex items-center gap-1.5">
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/60" />
          Stream job execution logs in real-time →{" "}
          <Link
            href="/logs?filter=log_type:eq:scheduler"
            className="text-primary underline underline-offset-2"
          >
            Global Logs → Scheduler
          </Link>
        </p>
      </div>
    </PageLayout>
  );
}
