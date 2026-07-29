"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  PageLayout,
  Button,
} from "@k2net/ui";
import {
  CalendarClock,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  HardDrive,
  RefreshCw,
  Timer,
  Archive,
  CloudUpload,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Info,
} from "lucide-react";
import { type SchedulerJob, type BackupArtifact } from "@/lib/mock-data/observability-mock";
import { useSchedulerStatus } from "@/hooks/useSchedulerStatus";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

export type JobStatus = "SUCCESS" | "FAILED" | "RUNNING" | "SKIPPED" | "UNKNOWN";

function StatusBadge({ status }: { status: SchedulerJob["lastStatus"] }) {
  const map: Record<JobStatus, { label: string; cls: string }> = {
    SUCCESS: { label: "SUCCESS", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
    FAILED:  { label: "FAILED",  cls: "border-rose-500/30 bg-rose-500/10 text-rose-400" },
    RUNNING: { label: "RUNNING", cls: "border-amber-500/30 bg-amber-500/10 text-amber-400 animate-pulse" },
    SKIPPED: { label: "SKIPPED", cls: "border-zinc-500/30 bg-zinc-500/10 text-muted-foreground" },
    UNKNOWN: { label: "UNKNOWN", cls: "border-zinc-500/30 bg-zinc-500/10 text-muted-foreground" },
  };
  const s = map[status] ?? map.UNKNOWN;
  return (
    <Badge className={`text-[10px] font-mono font-bold ${s.cls}`}>
      {s.label}
    </Badge>
  );
}

function StorageBadge({ target, label }: { target: BackupArtifact["storageTarget"]; label: string }) {
  const cls =
    target === "nextcloud-dr"
      ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
      : "border-violet-500/30 bg-violet-500/10 text-violet-400";
  return (
    <Badge className={`text-[10px] font-mono ${cls}`}>
      {label}
    </Badge>
  );
}

function CategoryIcon({ cat }: { cat: SchedulerJob["category"] }) {
  const map = {
    backup:      <HardDrive className="w-3.5 h-3.5 text-violet-400" />,
    sync:        <CloudUpload className="w-3.5 h-3.5 text-blue-400" />,
    maintenance: <RefreshCw className="w-3.5 h-3.5 text-amber-400" />,
    poller:      <Timer className="w-3.5 h-3.5 text-emerald-400" />,
  };
  return map[cat] ?? null;
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function RunNowDialog({
  job,
  onClose,
  onConfirm,
  triggering,
}: {
  job: SchedulerJob;
  onClose: () => void;
  onConfirm: () => void;
  triggering: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-border/80">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Play className="w-4 h-4 text-primary" />
            Trigger Manual Execution
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="rounded-lg bg-muted/40 border border-border/60 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CategoryIcon cat={job.category} />
              <p className="text-sm font-semibold text-foreground">{job.name}</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="font-mono text-[10px] border-border bg-muted/60 text-muted-foreground">
                {job.scriptFile}
              </Badge>
              <Badge className="font-mono text-[10px] border-border bg-muted/60 text-muted-foreground">
                {job.cronExpression}
              </Badge>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
            <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p>
              This will queue the job for immediate async execution on the server.
              Output logs will stream to{" "}
              <Link
                href="/logs?filter=log_type:eq:scheduler"
                className="text-primary underline underline-offset-2"
              >
                Global Logs → Scheduler
              </Link>
              .
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose} disabled={triggering}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onConfirm}
              disabled={triggering}
              className="gap-1.5"
            >
              {triggering ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {triggering ? "Queuing…" : "Run Job"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Checksum Modal ───────────────────────────────────────────────────────────

function ChecksumModal({
  artifact,
  onClose,
}: {
  artifact: BackupArtifact;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.checksumSha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-border/80">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Artifact Checksum
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <p className="text-xs text-muted-foreground font-mono truncate">
            {artifact.artifactName}
          </p>
          <div className="bg-muted/40 border border-border/60 rounded-lg p-3 flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-foreground/80 truncate">
              SHA-256: {artifact.checksumSha256}
            </span>
            <button
              onClick={handleCopy}
              className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Completed: {artifact.completedAt} · Size: {artifact.fileSize}
          </p>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Metadata Modal ───────────────────────────────────────────────────────────

function MetadataModal({
  artifact,
  onClose,
}: {
  artifact: BackupArtifact;
  onClose: () => void;
}) {
  const meta = {
    "Artifact Name": artifact.artifactName,
    "Source Script": artifact.sourceScript,
    "Storage Target": artifact.storageLabel,
    "File Size": artifact.fileSize,
    "Completed At": artifact.completedAt,
    "SHA-256": artifact.checksumSha256,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 shadow-2xl border-border/80">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Archive className="w-4 h-4 text-primary" />
            Artifact Metadata
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-2">
          {Object.entries(meta).map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-4 py-1.5 border-b border-border/40 last:border-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 w-28">
                {k}
              </span>
              <span className="text-xs font-mono text-foreground/80 text-right truncate max-w-[240px]">
                {v}
              </span>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SchedulerPage() {
  const { jobs, artifacts, loading, error, refresh } = useSchedulerStatus();
  const [runDialog, setRunDialog] = useState<SchedulerJob | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [triggeredIds, setTriggeredIds] = useState<Set<string>>(new Set());
  const [checksumModal, setChecksumModal] = useState<BackupArtifact | null>(null);
  const [metadataModal, setMetadataModal] = useState<BackupArtifact | null>(null);

  const hasFailedJobs = jobs.some((j) => j.lastStatus === "FAILED");

  // Stats for KPI cards
  const activeJobs = jobs.length;
  const lastBackup = jobs.find((j) => j.scriptKey === "backup");
  const lastSync = jobs.find((j) => j.scriptKey === "sync-nextcloud");
  const nextJob = jobs.reduce((a, b) =>
    a.nextRunAt < b.nextRunAt ? a : b
  );

  const handleTrigger = async () => {
    if (!runDialog || !SCRIPT_WHITELIST.has(runDialog.scriptKey)) return;
    setTriggering(true);
    try {
      const res = await fetch("/api/system/scheduler/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptKey: runDialog.scriptKey }),
      });
      if (res.ok) {
        setTriggeredIds((prev) => new Set([...prev, runDialog.id]));
      }
    } finally {
      setTriggering(false);
      setRunDialog(null);
    }
  };

  return (
    <>
      {/* ── Modals ── */}
      {runDialog && (
        <RunNowDialog
          job={runDialog}
          onClose={() => setRunDialog(null)}
          onConfirm={handleTrigger}
          triggering={triggering}
        />
      )}
      {checksumModal && (
        <ChecksumModal
          artifact={checksumModal}
          onClose={() => setChecksumModal(null)}
        />
      )}
      {metadataModal && (
        <MetadataModal
          artifact={metadataModal}
          onClose={() => setMetadataModal(null)}
        />
      )}

      <PageLayout variant="dashboard" spaceY="space-y-6">
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
            <p className="text-xs text-muted-foreground">
              Automated job scheduling, on-demand execution, and backup artifact validation.
            </p>
          </div>
          <Badge className="border-primary/20 bg-primary/10 text-primary text-[10px]">
            {loading ? "LOADING\u2026" : "LIVE DATA"}
          </Badge>
        </div>

        {/* ── 4 KPI Cards ── */}
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
              value: lastBackup?.lastStatus ?? "—",
              sub: `${lastBackup?.scriptFile} · Today ${lastBackup?.lastRunAt.split(" ")[1]} WIB`,
            },
            {
              label: "Offsite Sync (Nextcloud)",
              icon: <CloudUpload className="w-4 h-4 text-blue-400" />,
              value: "SYNCED",
              sub: `Last sync: Today ${lastSync?.lastRunAt.split(" ")[1]} WIB`,
            },
            {
              label: "Next Scheduled Run",
              icon: <Timer className="w-4 h-4 text-amber-400" />,
              value: nextJob.nextRunAt,
              sub: nextJob.name,
            },
          ].map((c) => (
            <Card key={c.label} className="p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </span>
                {c.icon}
              </div>
              <p className="text-xl font-bold text-foreground font-mono">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.sub}</p>
            </Card>
          ))}
        </div>

        {/* ── Section A: Cron Jobs Monitor ── */}
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Cron &amp; System Jobs Monitor
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Registered operational scripts with crontab schedule. Use{" "}
              <span className="font-semibold text-foreground">[Run Now]</span> to
              queue an immediate async execution — no blocking, no shell exec in
              web server thread.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_180px_100px_90px_140px_130px] px-5 py-2.5 border-b border-border bg-muted/30 gap-2">
              {[
                "Job Name & Script",
                "Cron Schedule",
                "Last Status",
                "Duration",
                "Next Run",
                "Actions",
              ].map((h) => (
                <span
                  key={h}
                  className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-border/60">
              {jobs.map((job) => {
                const wasTriggered = triggeredIds.has(job.id);
                return (
                  <div
                    key={job.id}
                    className="grid grid-cols-[1fr_180px_100px_90px_140px_130px] px-5 py-3.5 hover:bg-muted/20 transition-colors items-center gap-2"
                  >
                    {/* Job Name & Script */}
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CategoryIcon cat={job.category} />
                        <span className="text-sm font-semibold text-foreground truncate">
                          {job.name}
                        </span>
                      </div>
                      <Badge className="w-fit font-mono text-[10px] border-border bg-muted/60 text-muted-foreground">
                        {job.scriptFile}
                      </Badge>
                    </div>

                    {/* Cron */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-mono text-foreground/80">
                        {job.cronExpression}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {job.cronLabel}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <StatusBadge status={wasTriggered ? "RUNNING" : job.lastStatus} />
                    </div>

                    {/* Duration */}
                    <span className="text-xs font-mono text-muted-foreground">
                      {job.lastDuration}
                    </span>

                    {/* Next Run */}
                    <span className="text-xs font-mono text-muted-foreground">
                      {job.nextRunAt}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      {wasTriggered ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Queued
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] gap-1 font-mono"
                          onClick={() => setRunDialog(job)}
                        >
                          <Play className="w-3 h-3" />
                          Run Now
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Section B: Backup Artifacts ── */}
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Archive className="h-4 w-4 text-muted-foreground" />
              Backup Artifacts &amp; Offsite DR Explorer
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Validate backup archives generated by <code className="font-mono text-[10px] bg-muted px-1 rounded">backup-*.sh</code>{" "}
              and <code className="font-mono text-[10px] bg-muted px-1 rounded">sync-nextcloud.sh</code> across
              MinIO S3 and Nextcloud WebDAV (Layer-3 DR).
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_140px_200px_80px_140px_150px] px-5 py-2.5 border-b border-border bg-muted/30 gap-2">
              {[
                "Artifact Name",
                "Source Script",
                "Storage Target",
                "Size",
                "Timestamp",
                "Actions",
              ].map((h) => (
                <span
                  key={h}
                  className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-border/60">
              {artifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  className="grid grid-cols-[1fr_140px_200px_80px_140px_150px] px-5 py-3.5 hover:bg-muted/20 transition-colors items-center gap-2"
                >
                  {/* Artifact Name */}
                  <span className="text-xs font-mono text-foreground/80 truncate" title={artifact.artifactName}>
                    {artifact.artifactName.split("/").pop()}
                  </span>

                  {/* Source Script */}
                  <Badge className="w-fit font-mono text-[10px] border-border bg-muted/60 text-muted-foreground">
                    {artifact.sourceScript}
                  </Badge>

                  {/* Storage Target */}
                  <StorageBadge target={artifact.storageTarget} label={artifact.storageLabel} />

                  {/* File Size */}
                  <span className="text-xs font-mono text-muted-foreground">
                    {artifact.fileSize}
                  </span>

                  {/* Timestamp */}
                  <span className="text-xs font-mono text-muted-foreground">
                    {artifact.completedAt}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1 font-mono"
                      onClick={() => setChecksumModal(artifact)}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      Verify
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1 font-mono"
                      onClick={() => setMetadataModal(artifact)}
                    >
                      <Info className="w-3 h-3" />
                      Metadata
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Footer — Telemetry Link ── */}
        <div className="flex items-center justify-between pt-1 pb-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/60" />
            Stream job execution logs in real-time →{" "}
            <Link
              href="/logs?filter=log_type:eq:scheduler"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              Global Logs (Scheduler filter)
            </Link>
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">
            Backup strategy: Local → MinIO S3 → Nextcloud WebDAV (3-layer DR)
          </p>
        </div>
      </PageLayout>
    </>
  );
}
