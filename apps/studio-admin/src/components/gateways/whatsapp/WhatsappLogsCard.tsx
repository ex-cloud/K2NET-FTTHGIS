import React from "react";
import { Loader2, Sparkles, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, UniversalContextMenu, type ContextMenuGroupConfig } from "@k2net/ui";
import { toast } from "sonner";
import type { NotificationLog } from "@/lib/actions/gateways";

interface WhatsappLogsCardProps {
  logs: NotificationLog[];
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

function getWaContextMenuGroups(log: NotificationLog): ContextMenuGroupConfig[] {
  return [
    {
      items: [
        {
          label: "Tanya AI Status Pengiriman",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: {
                  prompt: `Analisa pengiriman WhatsApp ke nomor ${log.recipient}. Subject: ${log.subject || "Notifikasi"}. Status: ${log.status}. Berikan diagnosa pesan.`,
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
          label: "Salin Nomor WA",
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(log.recipient);
            toast.success(`Nomor ${log.recipient} disalin!`);
          },
        },
      ],
    },
  ];
}

export function WhatsappLogsCard({ logs, loading }: WhatsappLogsCardProps) {
  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
          Metrik Delivery WA
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
        ) : logs.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60 text-center py-4">Belum ada log WhatsApp tersimpan.</p>
        ) : (
          logs.map((log) => (
            <UniversalContextMenu key={log.id} groups={getWaContextMenuGroups(log)}>
              <div className="border-b border-border pb-3 last:border-b-0 last:pb-0 space-y-1 cursor-context-menu hover:bg-muted/10 p-1.5 rounded transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-foreground truncate max-w-[140px]">{log.recipient}</span>
                  <Badge
                    className={`text-[9px] px-1.5 py-0.5 border ${
                      log.status === "sent"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    }`}
                  >
                    {log.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono">
                  <span className="truncate max-w-[120px]">{log.subject || "WA Notification"}</span>
                  <span>{formatRelativeTime(log.sentAt)}</span>
                </div>
              </div>
            </UniversalContextMenu>
          ))
        )}
      </CardContent>
    </Card>
  );
}
