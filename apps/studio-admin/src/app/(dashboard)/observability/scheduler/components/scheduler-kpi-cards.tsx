"use client";

import React from "react";
import { Card } from "@k2net/ui";
import { CalendarClock, HardDrive, CloudUpload, Timer } from "lucide-react";
import { type SchedulerJob } from "@/lib/mock-data/observability-mock";
import { type DevopsBackupInfo } from "@/hooks/useSchedulerStatus";

interface SchedulerKpiCardsProps {
  jobs: SchedulerJob[];
  devopsBackupInfo: DevopsBackupInfo | null;
  loading: boolean;
  formatTimeSub: (timeStr?: string, prefix?: string) => string;
}

export function SchedulerKpiCards({
  jobs,
  devopsBackupInfo,
  loading,
  formatTimeSub,
}: SchedulerKpiCardsProps) {
  const activeJobs = jobs.length;
  const lastBackup = jobs.find((j) => j.scriptKey === "backup");
  const lastSync = jobs.find((j) => j.scriptKey === "sync-nextcloud");
  const nextJob = jobs.reduce((a, b) => (a.nextRunAt < b.nextRunAt ? a : b), jobs[0]);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[
        {
          label: "Scheduled Jobs (Active)",
          icon: <CalendarClock className="w-4 h-4 text-primary" />,
          value: String(activeJobs),
          sub: `${activeJobs} registered · ${jobs.filter((j) => j.lastStatus === "FAILED").length} failed in 24h`,
        },
        {
          label: "Last Backup Status",
          icon: <HardDrive className="w-4 h-4 text-violet-400" />,
          value: devopsBackupInfo?.status || lastBackup?.lastStatus || "SUCCESS",
          sub: devopsBackupInfo?.lastBackupTime
            ? `backup.sh · ${devopsBackupInfo.lastBackupTime}`
            : lastBackup?.lastRunAt
              ? `${lastBackup.scriptFile} · ${formatTimeSub(lastBackup.lastRunAt)}`
              : "backup.sh · Today 00:00 WIB",
        },
        {
          label: "Offsite Sync (Nextcloud)",
          icon: <CloudUpload className="w-4 h-4 text-blue-400" />,
          value: devopsBackupInfo?.nextcloudStatus || "SYNCED",
          sub: devopsBackupInfo?.nextcloudSyncTime
            ? `Last sync: ${devopsBackupInfo.nextcloudSyncTime}`
            : formatTimeSub(lastSync?.lastRunAt, "Last sync: "),
        },
        {
          label: "Next Scheduled Run",
          icon: <Timer className="w-4 h-4 text-amber-400" />,
          value: nextJob?.nextRunAt ?? "—",
          sub: nextJob?.name ?? "—",
        },
      ].map((c) => (
        <Card key={c.label} className="p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
              {c.label}
            </span>
            {c.icon}
          </div>
          <p className="text-xl font-bold text-foreground font-mono">{c.value}</p>
          <p className="text-xs text-foreground/75 dark:text-muted-foreground">{c.sub}</p>
        </Card>
      ))}
    </div>
  );
}
