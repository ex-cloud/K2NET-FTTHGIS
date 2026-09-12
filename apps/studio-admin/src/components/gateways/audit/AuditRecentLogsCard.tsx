import React from "react";
import { Loader2, Sparkles, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, UniversalContextMenu, type ContextMenuGroupConfig } from "@k2net/ui";
import { toast } from "sonner";
import type { AuditEvent } from "@/lib/actions/gateways";

interface AuditRecentLogsCardProps {
  logs: AuditEvent[];
  loading: boolean;
}

function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} mnt lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function getAuditContextMenuGroups(log: AuditEvent): ContextMenuGroupConfig[] {
  return [
    {
      items: [
        {
          label: "Tanya AI Investigasi Audit",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: {
                  prompt: `Investigasi log audit aktivitas "${log.action}" oleh user ${log.username || log.userId}. Status: ${log.status}, Target: ${log.target || "N/A"}, Waktu: ${log.createdAt}.`,
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
          label: "Salin Aksi",
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(log.action);
            toast.success(`Aksi ${log.action} disalin!`);
          },
        },
      ],
    },
  ];
}

export function AuditRecentLogsCard({ logs, loading }: AuditRecentLogsCardProps) {
  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
          Aktivitas Audit Terkini
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
        ) : logs.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60 text-center py-4">Belum ada log audit tercatat.</p>
        ) : (
          logs.map((log) => (
            <UniversalContextMenu key={log.id} groups={getAuditContextMenuGroups(log)}>
              <div className="border-b border-border pb-3 last:border-b-0 last:pb-0 space-y-1 cursor-context-menu hover:bg-muted/10 p-1.5 rounded transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-foreground font-mono">{log.action}</span>
                  <Badge
                    className={`text-[9px] px-1.5 py-0.5 border ${
                      log.status === "success"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : log.status === "denied"
                        ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {log.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono">
                  <span>@{log.username || log.userId}</span>
                  <span>{formatRelativeTime(log.createdAt)}</span>
                </div>
                {log.target && (
                  <div className="text-[9px] text-muted-foreground/60 truncate font-mono">Target: {log.target}</div>
                )}
              </div>
            </UniversalContextMenu>
          ))
        )}
      </CardContent>
    </Card>
  );
}
