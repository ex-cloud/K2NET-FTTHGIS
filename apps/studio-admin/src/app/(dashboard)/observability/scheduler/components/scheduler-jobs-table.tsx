"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@k2net/ui";
import { Clock, Loader2, Play, Info, HardDrive, CloudUpload, RefreshCw, Timer } from "lucide-react";
import { type SchedulerJob } from "@/lib/mock-data/observability-mock";

export type JobStatus = "SUCCESS" | "FAILED" | "RUNNING" | "SKIPPED" | "UNKNOWN";

function StatusBadge({ status }: { status: SchedulerJob["lastStatus"] }) {
  const map: Record<JobStatus, { label: string; cls: string }> = {
    SUCCESS: { label: "SUCCESS", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
    FAILED:  { label: "FAILED",  cls: "border-rose-500/30 bg-rose-500/10 text-rose-400" },
    RUNNING: { label: "RUNNING", cls: "border-amber-500/30 bg-amber-500/10 text-amber-400 animate-pulse" },
    SKIPPED: { label: "SKIPPED", cls: "border-zinc-500/30 bg-zinc-500/10 text-muted-foreground" },
    UNKNOWN: { label: "SUCCESS", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  };
  const s = map[status] ?? map.SUCCESS;
  return (
    <Badge className={`text-[10px] font-mono font-bold ${s.cls}`}>
      {s.label}
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

interface RunNowDialogProps {
  job: SchedulerJob;
  onClose: () => void;
  onConfirm: () => void;
  triggering: boolean;
}

function RunNowDialog({ job, onClose, onConfirm, triggering }: RunNowDialogProps) {
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
              <Link href="/logs?filter=log_type:eq:scheduler" className="text-primary underline underline-offset-2">
                Global Logs → Scheduler
              </Link>
              .
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose} disabled={triggering}>
              Cancel
            </Button>
            <Button size="sm" onClick={onConfirm} disabled={triggering} className="gap-1.5">
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

interface LiveLogModalProps {
  job: SchedulerJob;
  onClose: () => void;
}

function LiveLogModal({ job, onClose }: LiveLogModalProps) {
  const { data: session, update } = useSession();
  const [logs, setLogs] = useState<string[]>(["Connecting to logs stream..."]);
  const [loading, setLoading] = useState(true);
  const terminalEndRef = React.useRef<HTMLDivElement>(null);

  const fetchLogs = React.useCallback(async () => {
    if (!session?.accessToken) return;

    // Check token validity client-side before fetching
    try {
      const parts = session.accessToken.split(".");
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        if (Date.now() / 1000 > payload.exp - 5) {
          toast.info("Memperbarui sesi log...");
          await update();
          window.location.reload();
          return;
        }
      }
    } catch (e) {
      console.warn("Logs token validation failed", e);
    }

    try {
      const res = await fetch(`/api/v1/system/backup-status/logs/${job.scriptKey}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.logs) {
          setLogs(data.logs);
        }
      } else {
        setLogs([`Failed to retrieve logs: HTTP ${res.status} Unauthorized`]);
      }
    } catch (e) {
      console.error("Failed to fetch job logs:", e);
      setLogs([`Failed to fetch logs: ${e instanceof Error ? e.message : String(e)}`]);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, job.scriptKey, update]);

  React.useEffect(() => {
    if (session?.accessToken) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 2000);
      return () => clearInterval(interval);
    } else {
      const timer = setTimeout(() => {
        setLoading(false);
        setLogs(["Failed to load session authentication token. Please refresh the page."]);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [fetchLogs, session?.accessToken]);

  React.useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 shadow-2xl border-border/80 flex flex-col h-[400px]">
        <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between shrink-0">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Logs: {job.scriptFile}
            </CardTitle>
            <p className="text-[10px] text-foreground/75 dark:text-muted-foreground">Streaming stdout/stderr from background daemon.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">Close</Button>
        </CardHeader>
        <CardContent className="flex-1 bg-zinc-950 p-4 font-mono text-[11px] overflow-y-auto text-zinc-300 flex flex-col gap-1 rounded-b-lg">
          {loading ? (
            <div className="flex items-center gap-2 text-zinc-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Connecting to daemon...
            </div>
          ) : (
            <>
              {logs.map((logLine, idx) => (
                <div key={idx} className="whitespace-pre-wrap break-all leading-relaxed">
                  {logLine}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface SchedulerJobsTableProps {
  jobs: SchedulerJob[];
  triggerJob: (scriptKey: string) => Promise<boolean>;
  scriptWhitelist: Set<string>;
}

export function SchedulerJobsTable({
  jobs,
  triggerJob,
  scriptWhitelist,
}: SchedulerJobsTableProps) {
  const [runDialog, setRunDialog] = useState<SchedulerJob | null>(null);
  const [logDialog, setLogDialog] = useState<SchedulerJob | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [triggeredIds, setTriggeredIds] = useState<Set<string>>(new Set());

  const handleTrigger = async () => {
    if (!runDialog || !scriptWhitelist.has(runDialog.scriptKey)) return;
    const targetJob = runDialog;
    setTriggering(true);
    setTriggeredIds((prev) => new Set([...prev, targetJob.id]));
    try {
      await triggerJob(targetJob.scriptKey);
      setTimeout(() => {
        setTriggeredIds((prev) => {
          const next = new Set(prev);
          next.delete(targetJob.id);
          return next;
        });
      }, 5000);
    } finally {
      setTriggering(false);
      setRunDialog(null);
    }
  };

  return (
    <>
      {runDialog && (
        <RunNowDialog
          job={runDialog}
          onClose={() => setRunDialog(null)}
          onConfirm={handleTrigger}
          triggering={triggering}
        />
      )}

      {logDialog && (
        <LiveLogModal
          job={logDialog}
          onClose={() => setLogDialog(null)}
        />
      )}

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Cron &amp; System Jobs Monitor
          </CardTitle>
          <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
            Monitoring panel for registered operational system scripts managed by host OS crontab daemon. 
            On-demand run commands are restricted to host SSH terminal for container isolation security.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_150px_100px_80px_120px_180px] px-5 py-2.5 border-b border-border bg-muted/30 gap-2">
            {[
              "Job Name & Script",
              "Cron Schedule",
              "Last Status",
              "Duration",
              "Next Run",
              "Actions",
            ].map((h) => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
                {h}
              </span>
            ))}
          </div>

          <div className="divide-y divide-border/60">
            {jobs.map((job) => {
              const wasTriggered = triggeredIds.has(job.id) || job.lastStatus === "RUNNING";
              return (
                <div key={job.id} className="grid grid-cols-[1fr_150px_100px_80px_120px_180px] px-5 py-3.5 hover:bg-muted/20 transition-colors items-center gap-2">
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

                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono text-foreground/80">
                      {job.cronExpression}
                    </span>
                    <span className="text-[10px] text-foreground/75 dark:text-muted-foreground">
                      {job.cronLabel}
                    </span>
                  </div>

                  <div>
                    <StatusBadge status={wasTriggered ? "RUNNING" : job.lastStatus} />
                  </div>

                  <span className="text-xs font-mono text-foreground/75 dark:text-muted-foreground">
                    {job.lastDuration}
                  </span>

                  <span className="text-xs font-mono text-foreground/75 dark:text-muted-foreground">
                    {job.nextRunAt}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground bg-muted border border-border px-2.5 py-1.5 rounded font-semibold font-mono" title="Operational maintenance scripts are managed by the host OS daemon (crontab). On-demand execution is restricted to host SSH terminal for container security and environment compliance.">
                      SSH Only
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1 font-mono border-border/80"
                      onClick={() => setLogDialog(job)}
                    >
                      Logs
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
