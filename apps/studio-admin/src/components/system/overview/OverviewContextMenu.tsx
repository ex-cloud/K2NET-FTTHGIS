import React from "react";
import {
  UniversalContextMenu,
  type ContextMenuGroupConfig,
} from "@k2net/ui";
import {
  Sparkles,
  FileCode,
  Copy,
  Globe,
  ExternalLink,
  Cpu,
  CreditCard,
  Clock,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/lib/navigation-compat";
import type {
  SecurityAuditItem,
  BackgroundJobItem,
  SystemAlertItem,
  BillingEventItem,
} from "./recent-operations-types";

/* ── 1. Security Audit Context Menu (Reusing UniversalContextMenu) ── */
interface SecurityAuditContextMenuProps {
  item: SecurityAuditItem;
  onOpenDetail: (item: SecurityAuditItem) => void;
  children: React.ReactNode;
}

export function SecurityAuditContextMenu({
  item,
  onOpenDetail,
  children,
}: SecurityAuditContextMenuProps) {
  const router = useRouter();

  const groups: ContextMenuGroupConfig[] = [
    {
      items: [
        {
          label: "Tanya AI Analisis Log Ini",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            const prompt = `Analisis event audit keamanan [${item.severity || "INFO"}] Aksi: "${item.rawAction || item.action}", Aktor: "${item.rawActor || item.actor}", Tenant: "${item.targetTenant || item.tenantSlug || "global"}", Path: "${item.requestPath || "-"}", IP: "${item.ipAddress || "-"}". Apakah ada indikasi celah keamanan atau anomali?`;
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: { prompt },
              })
            );
            window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
          },
        },
        {
          label: "Buka Modal Detail Log",
          icon: FileCode,
          shortcut: "↵",
          onClick: () => onOpenDetail(item),
        },
      ],
    },
    {
      items: [
        {
          label: "Salin Log JSON",
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            const payload = item.rawJsonPayload || JSON.stringify(item, null, 2);
            navigator.clipboard.writeText(payload);
            toast.success("Payload log JSON disalin ke clipboard!");
          },
        },
        {
          label: "Salin Event ID",
          icon: Terminal,
          shortcut: "Alt+C",
          onClick: () => {
            navigator.clipboard.writeText(item.id);
            toast.success(`Event ID ${item.id.substring(0, 8)}... disalin!`);
          },
        },
        ...(item.requestPath
          ? [
              {
                label: "Salin Pathname URL",
                icon: Globe,
                onClick: () => {
                  navigator.clipboard.writeText(item.requestPath || item.action);
                  toast.success("Pathname disalin!");
                },
              },
            ]
          : []),
      ],
    },
    {
      items: [
        {
          label: "Buka di Global Logs Explorer",
          icon: ExternalLink,
          onClick: () => {
            const sev = (item.severity || "").toUpperCase();
            router.push(`/logs?severity=${sev}`);
          },
        },
      ],
    },
  ];

  return <UniversalContextMenu groups={groups}>{children}</UniversalContextMenu>;
}

/* ── 2. Background Jobs Context Menu (Reusing UniversalContextMenu) ── */
interface BackgroundJobContextMenuProps {
  item: BackgroundJobItem;
  children: React.ReactNode;
}

export function BackgroundJobContextMenu({ item, children }: BackgroundJobContextMenuProps) {
  const router = useRouter();

  const groups: ContextMenuGroupConfig[] = [
    {
      items: [
        {
          label: "Buka Scheduler Monitor",
          icon: Cpu,
          shortcut: "↵",
          onClick: () => router.push("/observability/scheduler"),
        },
        {
          label: "Tanya AI Analisis Job Ini",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            const prompt = `Analisis status background job "${item.jobType}" (ID: ${item.id}, Target: ${item.targetOrg}, Status: ${item.status}, Durasi: ${item.duration || "-"}). Apakah durasi dan performa job ini optimal?`;
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: { prompt },
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
          label: "Salin Job ID",
          icon: Copy,
          onClick: () => {
            navigator.clipboard.writeText(item.id);
            toast.success(`Job ID ${item.id} disalin!`);
          },
        },
        {
          label: "Salin Tipe Job",
          icon: Clock,
          onClick: () => {
            navigator.clipboard.writeText(item.jobType);
            toast.success("Nama tipe job disalin!");
          },
        },
      ],
    },
  ];

  return <UniversalContextMenu groups={groups}>{children}</UniversalContextMenu>;
}

/* ── 3. System Alerts Context Menu (Reusing UniversalContextMenu) ── */
interface SystemAlertContextMenuProps {
  item: SystemAlertItem;
  children: React.ReactNode;
}

export function SystemAlertContextMenu({ item, children }: SystemAlertContextMenuProps) {
  const router = useRouter();

  const groups: ContextMenuGroupConfig[] = [
    {
      items: [
        {
          label: item.actionLabel || "Buka Observability & Diagnostik",
          icon: ExternalLink,
          shortcut: "↵",
          onClick: () => {
            if (item.actionUrl) router.push(item.actionUrl);
            else router.push("/observability/overview");
          },
        },
        {
          label: "Tanya AI Solusi Alert Ini",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            const prompt = `Berikan rekomendasi remediasi teknis untuk alert sistem [${item.severity.toUpperCase()}] "${item.title}" pada service "${item.service}": "${item.message}". Langkah diagnostik apa yang harus diambil Super Admin?`;
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: { prompt },
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
          label: "Salin Deskripsi Alert",
          icon: Copy,
          onClick: () => {
            navigator.clipboard.writeText(`[${item.severity.toUpperCase()}] ${item.title} (${item.service}): ${item.message}`);
            toast.success("Deskripsi alert disalin ke clipboard!");
          },
        },
      ],
    },
  ];

  return <UniversalContextMenu groups={groups}>{children}</UniversalContextMenu>;
}

/* ── 4. Billing Events Context Menu (Reusing UniversalContextMenu) ── */
interface BillingEventContextMenuProps {
  item: BillingEventItem;
  children: React.ReactNode;
}

export function BillingEventContextMenu({ item, children }: BillingEventContextMenuProps) {
  const router = useRouter();

  const groups: ContextMenuGroupConfig[] = [
    {
      items: [
        {
          label: "Buka Subscriptions Organisasi",
          icon: CreditCard,
          shortcut: "↵",
          onClick: () => router.push("/organizations"),
        },
        {
          label: "Tanya AI Analisis Billing Ini",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            const prompt = `Analisis status langganan & billing tenant "${item.orgName}" (Plan: ${item.planName}, Amount: ${item.amount}, Status: ${item.status}, Info: ${item.eventLabel}). Berikan saran optimasi tier langganan.`;
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: { prompt },
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
          label: "Salin Info Billing",
          icon: Copy,
          onClick: () => {
            navigator.clipboard.writeText(`${item.orgName} (${item.orgSlug}) - ${item.planName}: ${item.amount} [${item.status}]`);
            toast.success("Info billing disalin ke clipboard!");
          },
        },
        {
          label: "Salin Slug Tenant",
          icon: Terminal,
          onClick: () => {
            navigator.clipboard.writeText(item.orgSlug || item.orgName);
            toast.success("Slug organisasi disalin!");
          },
        },
      ],
    },
  ];

  return <UniversalContextMenu groups={groups}>{children}</UniversalContextMenu>;
}
