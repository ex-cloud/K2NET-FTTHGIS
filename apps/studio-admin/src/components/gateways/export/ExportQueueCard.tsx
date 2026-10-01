import React from "react";
import { Download, Loader2, Sparkles, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, UniversalContextMenu, type ContextMenuGroupConfig } from "@k2net/ui";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import type { ExportJob } from "@/lib/actions/gateways";

interface ExportQueueCardProps {
  jobs: ExportJob[];
  loading: boolean;
}

function formatRelativeTime(dateStr: string | null | undefined, t: (key: string) => string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return t("common.just_now") || "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

function getExportContextMenuGroups(exp: ExportJob, t: (key: string) => string): ContextMenuGroupConfig[] {
  return [
    {
      items: [
        {
          label: t("gateways.export.ask_ai"),
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: {
                  prompt: `Analisa job export tipe ${exp.type} untuk tenant ${exp.tenantSlug}. Status: ${exp.status}. Dibuat pada: ${exp.createdAt}. ${exp.downloadUrl ? `Download URL: ${exp.downloadUrl}` : ""}`,
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
          label: t("gateways.export.copy_job_id"),
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(exp.jobId);
            toast.success(t("gateways.export.job_id_copied"));
          },
        },
        ...(exp.downloadUrl
          ? [
              {
                label: t("gateways.export.copy_download_url"),
                icon: Download,
                shortcut: "Alt+C",
                onClick: () => {
                  navigator.clipboard.writeText(exp.downloadUrl || "");
                  toast.success(t("gateways.export.download_url_copied"));
                },
              },
            ]
          : []),
      ],
    },
  ];
}

export function ExportQueueCard({ jobs, loading }: ExportQueueCardProps) {
  const { t } = useTranslation();

  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
          {t("gateways.export.recent_queue")}
          {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted/40 rounded animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60 text-center py-4">{t("gateways.export.no_history")}</p>
        ) : (
          jobs.map((exp) => (
            <UniversalContextMenu key={exp.jobId} groups={getExportContextMenuGroups(exp, t)}>
              <div className="border-b border-border pb-3 last:border-b-0 last:pb-0 space-y-1 cursor-context-menu hover:bg-muted/10 p-1.5 rounded transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-foreground truncate max-w-[150px] capitalize">
                    {exp.type} Export
                  </span>
                  <Badge
                    className={`text-[9px] px-1.5 py-0.5 border ${
                      exp.status === "done"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : exp.status === "failed"
                        ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        : exp.status === "processing"
                        ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                        : "bg-muted/10 text-muted-foreground border-border"
                    }`}
                  >
                    {exp.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono">
                  <span>Tenant: {exp.tenantSlug}</span>
                  <span>{formatRelativeTime(exp.createdAt, t)}</span>
                </div>
                {exp.downloadUrl && exp.status === "done" && (
                  <div className="text-[9px] text-primary truncate">↓ {exp.downloadUrl.split("/").pop()}</div>
                )}
              </div>
            </UniversalContextMenu>
          ))
        )}
      </CardContent>
    </Card>
  );
}
