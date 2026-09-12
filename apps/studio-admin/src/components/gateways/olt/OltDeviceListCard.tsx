import React from "react";
import { Loader2, Sparkles, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, UniversalContextMenu, type ContextMenuGroupConfig } from "@k2net/ui";
import { toast } from "sonner";
import type { OLTDevice } from "@/lib/actions/gateways";

interface OltDeviceListCardProps {
  devices: OLTDevice[];
  loading: boolean;
}

function getOltContextMenuGroups(dev: OLTDevice): ContextMenuGroupConfig[] {
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
                  prompt: `Analisa perangkat OLT ${dev.name || dev.host} vendor ${dev.vendor} IP ${dev.host}:${dev.port || 161}. Berikan diagnosa konektivitas perangkat.`,
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
          label: "Salin IP/Host OLT",
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

export function OltDeviceListCard({ devices, loading }: OltDeviceListCardProps) {
  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
          OLT Node State
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
          <p className="text-[10px] text-muted-foreground/60 text-center py-4">Belum ada perangkat OLT terdaftar.</p>
        ) : (
          devices.map((dev) => (
            <UniversalContextMenu key={dev.id} groups={getOltContextMenuGroups(dev)}>
              <div className="border-b border-border pb-3 last:border-b-0 last:pb-0 space-y-1 cursor-context-menu hover:bg-muted/10 p-1.5 rounded transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-foreground">{dev.name || dev.host}</span>
                  <Badge className="bg-muted/10 text-muted-foreground border-border text-[9px] px-1.5 py-0.5 border capitalize">
                    {dev.vendor}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono">
                  <span>
                    {dev.host}:{dev.port || 161}
                  </span>
                  <span className="text-muted-foreground/60">{new Date(dev.updatedAt).toLocaleDateString("id-ID")}</span>
                </div>
              </div>
            </UniversalContextMenu>
          ))
        )}
      </CardContent>
    </Card>
  );
}
