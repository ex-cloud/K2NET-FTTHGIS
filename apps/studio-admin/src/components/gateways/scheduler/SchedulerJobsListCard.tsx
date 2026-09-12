import React from "react";
import { Loader2, Sparkles, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, UniversalContextMenu, type ContextMenuGroupConfig } from "@k2net/ui";
import { toast } from "sonner";
import type { SchedulerJob } from "@/lib/actions/gateways";

interface SchedulerJobsListCardProps {
  jobs: SchedulerJob[];
  loading: boolean;
}

function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "Belum pernah";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  if (diffMs < 0) {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSchedulerJobContextMenuGroups(job: SchedulerJob): ContextMenuGroupConfig[] {
  return [
    {
      items: [
        {
          label: "Tanya AI Diagnosa Job",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: {
                  prompt: `Analisa background job cron "${job.name}". Cron Expression: ${job.cronExpr}, Status: ${job.isActive ? "Aktif" : "Non-aktif"}, Terakhir jalan: ${job.lastRunAt || "Belum pernah"}. Berikan analisa efisiensi penjadwalan.`,
                },
              })
            );
            window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
          },
        },
      ],
    },
    {
      items: [
        {
          label: "Salin Cron Expression",
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(job.cronExpr);
            toast.success(`Cron expression ${job.cronExpr} disalin!`);
          },
        },
      ],
    },
  ];
}

export function SchedulerJobsListCard({ jobs, loading }: SchedulerJobsListCardProps) {
  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
          Daftar Cron Job Aktif
          {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted/40 rounded animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60 text-center py-4">Belum ada cron job terdaftar.</p>
        ) : (
          jobs.map((job) => (
            <UniversalContextMenu key={job.id} groups={getSchedulerJobContextMenuGroups(job)}>
              <div className="border-b border-border pb-3 last:border-b-0 last:pb-0 space-y-1 cursor-context-menu hover:bg-muted/10 p-1.5 rounded transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-foreground">{job.name}</span>
                  <Badge
                    className={`text-[9px] px-1.5 py-0.5 border ${
                      job.isActive
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-muted/10 text-muted-foreground border-border"
                    }`}
                  >
                    {job.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono">
                  <span>Cron: {job.cronExpr}</span>
                  <span>{formatRelativeTime(job.lastRunAt)}</span>
                </div>
                {job.nextRunAt && (
                  <div className="text-[9px] text-muted-foreground/60 font-mono">
                    Next: {formatRelativeTime(job.nextRunAt)}
                  </div>
                )}
              </div>
            </UniversalContextMenu>
          ))
        )}
      </CardContent>
    </Card>
  );
}
