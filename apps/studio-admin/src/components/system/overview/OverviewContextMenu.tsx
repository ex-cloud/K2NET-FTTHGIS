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
import { useTranslation } from "@k2net/i18n";

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
  const { t } = useTranslation();

  const groups: ContextMenuGroupConfig[] = [
    {
      items: [
        {
          label: t("observability.ask_ai_analyze_log"),
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
          label: t("observability.open_log_detail_modal"),
          icon: FileCode,
          shortcut: "↵",
          onClick: () => onOpenDetail(item),
        },
      ],
    },
    {
      items: [
        {
          label: t("observability.copy_log_json"),
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            const payload = item.rawJsonPayload || JSON.stringify(item, null, 2);
            navigator.clipboard.writeText(payload);
            toast.success(t("observability.log_copied"));
          },
        },
        {
          label: t("observability.copy_event_id"),
          icon: Terminal,
          shortcut: "Alt+C",
          onClick: () => {
            navigator.clipboard.writeText(item.id);
            toast.success(t("observability.event_id_copy_success"));
          },
        },
        ...(item.requestPath
          ? [
              {
                label: t("observability.copy_pathname"),
                icon: Globe,
                onClick: () => {
                  navigator.clipboard.writeText(item.requestPath || item.action);
                  toast.success(t("observability.pathname_copied"));
                },
              },
            ]
          : []),
      ],
    },
    {
      items: [
        {
          label: t("observability.open_in_logs_explorer"),
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
  const { t } = useTranslation();

  const groups: ContextMenuGroupConfig[] = [
    {
      items: [
        {
          label: t("observability.open_scheduler_monitor"),
          icon: Cpu,
          shortcut: "↵",
          onClick: () => router.push("/observability/scheduler"),
        },
        {
          label: t("observability.ask_ai_analyze_job"),
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
          label: t("observability.copy_job_id"),
          icon: Copy,
          onClick: () => {
            navigator.clipboard.writeText(item.id);
            toast.success(`Job ID ${item.id} disalin!`);
          },
        },
        {
          label: t("observability.copy_job_type"),
          icon: Clock,
          onClick: () => {
            navigator.clipboard.writeText(item.jobType);
            toast.success(t("observability.job_type_copied"));
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
  const { t } = useTranslation();

  const groups: ContextMenuGroupConfig[] = [
    {
      items: [
        {
          label: item.actionLabel || t("observability.open_observability_diag"),
          icon: ExternalLink,
          shortcut: "↵",
          onClick: () => {
            if (item.actionUrl) router.push(item.actionUrl);
            else router.push("/observability/overview");
          },
        },
        {
          label: t("observability.ask_ai_alert_solution"),
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
          label: t("observability.copy_alert_desc"),
          icon: Copy,
          onClick: () => {
            navigator.clipboard.writeText(`[${item.severity.toUpperCase()}] ${item.title} (${item.service}): ${item.message}`);
            toast.success(t("observability.alert_desc_copied"));
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
  const { t } = useTranslation();

  const groups: ContextMenuGroupConfig[] = [
    {
      items: [
        {
          label: t("observability.open_org_subscriptions"),
          icon: CreditCard,
          shortcut: "↵",
          onClick: () => router.push("/organizations"),
        },
        {
          label: t("observability.ask_ai_analyze_billing"),
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
          label: t("observability.copy_billing_info"),
          icon: Copy,
          onClick: () => {
            navigator.clipboard.writeText(`${item.orgName} (${item.orgSlug}) - ${item.planName}: ${item.amount} [${item.status}]`);
            toast.success(t("observability.billing_info_copied"));
          },
        },
        {
          label: t("observability.copy_tenant_slug"),
          icon: Terminal,
          onClick: () => {
            navigator.clipboard.writeText(item.orgSlug || item.orgName);
            toast.success(t("observability.tenant_slug_copied"));
          },
        },
      ],
    },
  ];

  return <UniversalContextMenu groups={groups}>{children}</UniversalContextMenu>;
}
