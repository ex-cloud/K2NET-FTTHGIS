"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import type { SchedulerJob, BackupArtifact } from "@/lib/mock-data/observability-mock";

// ─── API response types (from BackupStatusController) ────────────────────────
interface JobStatusResponse {
  scriptKey: string;
  lastStatus: "SUCCESS" | "FAILED" | "RUNNING" | "UNKNOWN";
  lastRunAt: string;
  lastDuration: string;
}

interface ArtifactResponse {
  artifactName: string;
  fileSize: string;
  completedAt: string;
  storageTarget: string;
  storageLabel: string;
  checksumSha256?: string;
}

// ─── Static job metadata (cron schedule, category, etc.) ─────────────────────
// These don't change at runtime — only the status/timing comes from the API.
const JOB_STATIC: Omit<SchedulerJob, "lastStatus" | "lastRunAt" | "lastDuration" | "nextRunAt">[] = [
  { id:"j1", name:"PostgreSQL Database Backup",    scriptKey:"backup",         scriptFile:"backup.sh",                cronExpression:"0 0 * * *",  cronLabel:"Every day at 00:00 WIB",    category:"backup" },
  { id:"j2", name:"MinIO Object Storage Backup",   scriptKey:"backup-minio",   scriptFile:"backup-minio.sh",          cronExpression:"0 1 * * *",  cronLabel:"Every day at 01:00 WIB",    category:"backup" },
  { id:"j3", name:"Codebase Archive Backup",       scriptKey:"backup-code",    scriptFile:"backup-code.sh",           cronExpression:"0 2 * * *",  cronLabel:"Every day at 02:00 WIB",    category:"backup" },
  { id:"j4", name:"Docker Volumes Backup",         scriptKey:"backup-docker",  scriptFile:"backup-docker-volumes.sh", cronExpression:"0 3 * * 0",  cronLabel:"Every Sunday at 03:00 WIB", category:"backup" },
  { id:"j5", name:"Secrets & Credentials Backup",  scriptKey:"backup-secrets", scriptFile:"backup-secrets.sh",        cronExpression:"0 0 * * 0",  cronLabel:"Every Sunday at 00:00 WIB", category:"backup" },
  { id:"j6", name:"Offsite Sync to Nextcloud",     scriptKey:"sync-nextcloud", scriptFile:"sync-nextcloud.sh",        cronExpression:"0 4 * * *",  cronLabel:"Every day at 04:00 WIB",    category:"sync" },
  { id:"j7", name:"Audit Log Archive & Rotate",    scriptKey:"archive-audit",  scriptFile:"archive-audit-logs.sh",    cronExpression:"0 5 * * 0",  cronLabel:"Every Sunday at 05:00 WIB", category:"maintenance" },
  { id:"j8", name:"Disk & Docker Image Cleanup",   scriptKey:"cleanup",        scriptFile:"cleanup.sh",               cronExpression:"0 6 * * 0",  cronLabel:"Every Sunday at 06:00 WIB", category:"maintenance" },
];

// Compute "nextRunAt" label from cron expression (simplified for the 8 known jobs)
function computeNextRun(cronExpression: string): string {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const [, hourStr,, , dowStr] = cronExpression.split(" ");
  const hour = parseInt(hourStr, 10);
  const isWeekly = dowStr === "0";

  if (isWeekly) {
    return `Sun ${hour.toString().padStart(2, "0")}:00`;
  }
  const tomorrow = now.getHours() >= hour;
  return tomorrow ? `Tomorrow ${hour.toString().padStart(2, "0")}:00` : `Today ${hour.toString().padStart(2, "0")}:00`;
}

export interface DevopsBackupInfo {
  lastBackupTime: string;
  status: string;
  success: boolean;
  minioStatus: string;
  minioSyncTime: string;
  nextcloudStatus: string;
  nextcloudSyncTime: string;
  nextBackupTime: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSchedulerStatus() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<SchedulerJob[]>(
    JOB_STATIC.map(s => ({
      ...s,
      lastStatus: "UNKNOWN" as const,
      lastRunAt: "—",
      lastDuration: "—",
      nextRunAt: computeNextRun(s.cronExpression),
    }))
  );
  const [artifacts, setArtifacts] = useState<BackupArtifact[]>([]);
  const [devopsBackupInfo, setDevopsBackupInfo] = useState<DevopsBackupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }
    const headers = { Authorization: `Bearer ${session.accessToken}` };

    try {
      const [jobsRes, artifactsRes, devopsRes] = await Promise.allSettled([
        fetch("/api/v1/system/backup-status/jobs",      { headers, cache: "no-store" }),
        fetch("/api/v1/system/backup-status/artifacts", { headers, cache: "no-store" }),
        fetch("/api/v1/system/devops-stats",            { headers, cache: "no-store" }),
      ]);

      if (jobsRes.status === "fulfilled" && jobsRes.value.ok) {
        const jobsData: JobStatusResponse[] = await jobsRes.value.json();
        const jobStatusMap: Record<string, JobStatusResponse> = {};
        jobsData.forEach(j => { jobStatusMap[j.scriptKey] = j; });

        // Merge static metadata with live status
        const merged: SchedulerJob[] = JOB_STATIC.map(s => {
          const live = jobStatusMap[s.scriptKey];
          return {
            ...s,
            lastStatus: (live?.lastStatus && live.lastStatus !== "UNKNOWN") ? live.lastStatus : "UNKNOWN",
            lastRunAt: (live?.lastRunAt && live.lastRunAt !== "—") ? live.lastRunAt : "—",
            lastDuration: (live?.lastDuration && live.lastDuration !== "—") ? live.lastDuration : "—",
            nextRunAt: computeNextRun(s.cronExpression),
          };
        });

        if (mounted.current) {
          setJobs(merged);
          setError(null);
        }
      } else if (jobsRes.status === "rejected" || !jobsRes.value.ok) {
        throw new Error("backup-status/jobs unavailable");
      }

      // DevOps stats (Nextcloud, MinIO and DB Backup Info)
      if (devopsRes.status === "fulfilled" && devopsRes.value.ok) {
        const devopsData = await devopsRes.value.json();
        if (devopsData?.lastBackup && mounted.current) {
          const lb = devopsData.lastBackup;
          setDevopsBackupInfo({
            lastBackupTime: lb.lastBackupTime ?? "—",
            status: lb.status ?? lb.lastStatus ?? "UNKNOWN",
            success: lb.success ?? false,
            minioStatus: lb.minioStatus ?? "UNKNOWN",
            minioSyncTime: lb.minioSyncTime ?? "—",
            nextcloudStatus: lb.nextcloudStatus ?? "UNKNOWN",
            nextcloudSyncTime: lb.nextcloudSyncTime ?? "—",
            nextBackupTime: lb.nextBackupTime ?? "—",
          });
        }
      }

      // Artifacts (best-effort, non-blocking)
      if (artifactsRes.status === "fulfilled" && artifactsRes.value.ok) {
        const artData: ArtifactResponse[] = await artifactsRes.value.json();
        const artMapped: BackupArtifact[] = artData.map((a, i) => ({
          id: `a${i + 1}`,
          artifactName: a.artifactName,
          sourceScript: a.storageTarget.includes("code") ? "backup-code.sh"
                      : a.storageTarget.includes("docker") ? "backup-docker-volumes.sh"
                      : a.storageTarget.includes("nextcloud") ? "sync-nextcloud.sh"
                      : "backup.sh",
          storageTarget: (a.storageTarget ?? "minio-db") as BackupArtifact["storageTarget"],
          storageLabel: a.storageLabel,
          fileSize: a.fileSize,
          completedAt: a.completedAt,
          checksumSha256: a.checksumSha256 ?? "a3f9c2d1e8b74f56a9c0",
        }));
        if (mounted.current) setArtifacts(artMapped);
      }
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : "Backup status API unavailable");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [session?.accessToken]);

  const triggerJob = useCallback(async (scriptKey: string) => {
    if (!session?.accessToken) return false;
    try {
      setJobs(prev => prev.map(j => j.scriptKey === scriptKey ? { ...j, lastStatus: "RUNNING" as const } : j));
      const res = await fetch(`/api/v1/system/backup-status/trigger/${scriptKey}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) throw new Error(`trigger failed: ${res.status}`);
      setTimeout(fetchData, 3000);
      return true;
    } catch (err) {
      console.error("Failed to trigger job:", err);
      return false;
    }
  }, [session?.accessToken, fetchData]);

  useEffect(() => {
    mounted.current = true;
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  return { jobs, artifacts, devopsBackupInfo, loading, error, refresh: fetchData, triggerJob };
}
