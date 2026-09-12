import React from "react";
import { Loader2, Sparkles, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, UniversalContextMenu, type ContextMenuGroupConfig } from "@k2net/ui";
import { toast } from "sonner";
import type { PollerDeviceStatus } from "@/lib/actions/gateways";

interface PollerDeviceStatusCardProps {
  devices: PollerDeviceStatus[];
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

function getPollerContextMenuGroups(dev: PollerDeviceStatus): ContextMenuGroupConfig[] {
  return [
    {
      items: [
        {
          label: "Tanya AI Status Perangkat",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: {
                  prompt: `Analisa status telemetry poller untuk perangkat ${dev.name || dev.host} (${dev.deviceCode}). Status: ${dev.status}, Respon: ${dev.responseTimeMs}ms, Terakhir dipolling: ${dev.lastPolledAt}.`,
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
          label: "Salin Host",
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(dev.host);
            toast.success(`Host ${dev.host} disalin!`);
          },
        },
      ],
    },
  ];
}

export function PollerDeviceStatusCard({ devices, loading }: PollerDeviceStatusCardProps) {
  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
          Device Status Live
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
        ) : devices.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60 text-center py-4">Belum ada device status tercatat.</p>
        ) : (
          devices.map((dev) => (
            <UniversalContextMenu key={dev.deviceCode} groups={getPollerContextMenuGroups(dev)}>
              <div className="border-b border-border pb-3 last:border-b-0 last:pb-0 space-y-1 cursor-context-menu hover:bg-muted/10 p-1.5 rounded transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-foreground">{dev.name || dev.host}</span>
                  <Badge
                    className={`text-[9px] px-1.5 py-0.5 border ${
                      dev.status === "up"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : dev.status === "down"
                        ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {dev.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono">
                  <span>
                    {dev.host} · {dev.responseTimeMs}ms
                  </span>
                  <span>{formatRelativeTime(dev.lastPolledAt)}</span>
                </div>
              </div>
            </UniversalContextMenu>
          ))
        )}
      </CardContent>
    </Card>
  );
}
