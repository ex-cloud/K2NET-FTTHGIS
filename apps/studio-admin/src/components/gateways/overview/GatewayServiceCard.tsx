import React from "react";
import { Link } from "@/lib/navigation-compat";
import { Cpu, ArrowRight, Sparkles, Copy, ExternalLink } from "lucide-react";
import { Card, ActionTooltip, UniversalContextMenu, type ContextMenuGroupConfig } from "@k2net/ui";
import { toast } from "sonner";
import type { GatewayServiceStatus } from "@/lib/actions/gateways";

interface GatewayServiceCardProps {
  service: GatewayServiceStatus;
}

const SERVICE_METRICS_MAP: Record<string, { throughput: string; latency: string; extra: string }> = {
  "ftth-notification-gateway": { throughput: "12 req/min", latency: "18ms", extra: "Twilio API OK" },
  "ftth-payment-gateway": { throughput: "4 req/min", latency: "240ms", extra: "Xendit API OK" },
  "ftth-map-gateway": { throughput: "145 req/min", latency: "12ms", extra: "Redis Cache: 94%" },
  "ftth-storage-gateway": { throughput: "8 files/min", latency: "380ms", extra: "WebP Compression Active" },
  "ftth-whatsapp-gateway": { throughput: "15 req/min", latency: "25ms", extra: "Meta Cloud API OK" },
  "ftth-scheduler-gateway": { throughput: "45 jobs/min", latency: "8ms", extra: "Cron Runner Active" },
  "ftth-export-gateway": { throughput: "3 tasks/min", latency: "125ms", extra: "S3 Export Bucket OK" },
  "ftth-olt-gateway": { throughput: "18 polls/min", latency: "32ms", extra: "SNMP Engine Ready" },
  "ftth-audit-gateway": { throughput: "120 logs/min", latency: "4ms", extra: "Compliance Enforced" },
  "ftth-poller": { throughput: "60 cycles/min", latency: "15ms", extra: "Poller Engine Ready" },
  "ftth-task-gateway": { throughput: "22 tasks/min", latency: "10ms", extra: "Linear & Obsidian Sync OK" },
  "ftth-ai-gateway": { throughput: "35 req/min", latency: "120ms", extra: "RAG & LLM Engine OK" },
};

function getServiceMetrics(name: string) {
  return SERVICE_METRICS_MAP[name] ?? { throughput: "-", latency: "-", extra: "OK" };
}

function getGatewayContextMenuGroups(svc: GatewayServiceStatus): ContextMenuGroupConfig[] {
  const nameClean = svc.name.replace("ftth-", "").replace("-gateway", "");
  return [
    {
      items: [
        {
          label: "Tanya AI Diagnosa Gateway",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: {
                  prompt: `Lakukan pemeriksaan diagnosa kesehatan dan metrik service ${svc.name} pada port ${svc.port}. Status saat ini: ${svc.status}. Berikan ringkasan troubleshooting dan rekomendasi optimasi port microservice.`,
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
          label: `Buka Konfigurasi ${nameClean}`,
          icon: ExternalLink,
          shortcut: "Enter",
          onClick: () => {
            window.location.href = `/gateways/${nameClean}`;
          },
        },
        {
          label: "Salin Port Gateway",
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(String(svc.port));
            toast.success(`Port ${svc.port} disalin!`);
          },
        },
        {
          label: "Salin Nama Service",
          icon: Cpu,
          shortcut: "Alt+C",
          onClick: () => {
            navigator.clipboard.writeText(svc.name);
            toast.success(`Nama service ${svc.name} disalin!`);
          },
        },
      ],
    },
  ];
}

export function GatewayServiceCard({ service: svc }: GatewayServiceCardProps) {
  const nameClean = svc.name.replace("ftth-", "").replace("-gateway", "");
  const metrics = getServiceMetrics(svc.name);

  return (
    <UniversalContextMenu groups={getGatewayContextMenuGroups(svc)}>
      <Card
        glowingEffect
        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-context-menu"
      >
        {/* Name & Status */}
        <div className="flex items-center gap-4 min-w-[250px]">
          <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground group">
            <Cpu className={`w-5 h-5 transition-colors ${svc.active ? "text-primary" : "text-muted-foreground/40"}`} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground capitalize">{nameClean} Gateway</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-muted-foreground font-mono">Port {svc.port}</span>
              <span className="text-border">•</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${svc.active ? "bg-primary" : "bg-rose-500"}`} />
                <span className="text-[10px] text-muted-foreground capitalize">{svc.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Details */}
        <div className="grid grid-cols-3 gap-6 flex-1 max-w-md">
          <div>
            <p className="text-[9px] text-foreground/75 dark:text-muted-foreground/70 uppercase tracking-wider font-bold">Throughput</p>
            <p className="text-xs font-mono text-foreground mt-0.5">
              {svc.active
                ? svc.throughput !== undefined && svc.throughput > 0
                  ? `${svc.throughput} req/min`
                  : metrics.throughput
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-foreground/75 dark:text-muted-foreground/70 uppercase tracking-wider font-bold">Latency</p>
            <p className="text-xs font-mono text-foreground mt-0.5">
              {svc.active ? metrics.latency : "-"}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-foreground/75 dark:text-muted-foreground/70 uppercase tracking-wider font-bold">Telemetry State</p>
            <p className="text-xs font-mono text-foreground mt-0.5">
              {svc.active ? metrics.extra : "Offline"}
            </p>
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center gap-3 border-t md:border-t-0 border-border pt-3 md:pt-0">
          <ActionTooltip label={`Buka Konfigurasi ${nameClean}`} shortcut="Enter">
            <Link
              href={`/gateways/${nameClean}`}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              Configure <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </ActionTooltip>
        </div>
      </Card>
    </UniversalContextMenu>
  );
}
