import * as React from "react";
import {
  PageLayout,
  PageHero,
  Card,
  Button,
  toast,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  Bell,
  RefreshCcw,
  Search,
  Clock,
  AlertTriangle,
  RotateCw,
  ShieldAlert,
} from "lucide-react";
import {
  useRenewalQueue,
  useRenewalDispatchLogs,
  useRetryNotification,
  useTriggerLicenseReminder,
  type RenewalQueueItem,
  type RenewalDispatchLog,
} from "@/hooks/useBillingRenewals";
import { RenewalQueueTable } from "@/components/renewals/RenewalQueueTable";
import { DispatchLogsTable } from "@/components/renewals/DispatchLogsTable";
import { TriggerReminderDialog } from "@/components/renewals/TriggerReminderDialog";
import { RetryDispatchDialog } from "@/components/renewals/RetryDispatchDialog";
import { LogPayloadDetailDialog } from "@/components/renewals/LogPayloadDetailDialog";

export default function BillingRenewalsPage() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = React.useState<"queue" | "logs">("queue");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Dialog states
  const [reminderTarget, setReminderTarget] = React.useState<RenewalQueueItem | null>(null);
  const [retryTarget, setRetryTarget] = React.useState<RenewalDispatchLog | null>(null);
  const [selectedPayloadLog, setSelectedPayloadLog] = React.useState<RenewalDispatchLog | null>(null);

  // Queries & Mutations
  const {
    data: queue = [],
    isLoading: isQueueLoading,
    refetch: refetchQueue,
  } = useRenewalQueue();

  const {
    data: logs = [],
    isLoading: isLogsLoading,
    refetch: refetchLogs,
  } = useRenewalDispatchLogs();

  const triggerMutation = useTriggerLicenseReminder();
  const retryMutation = useRetryNotification();

  // KPIs
  const due30dCount = React.useMemo(() => {
    return queue.filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 30).length;
  }, [queue]);

  const graceCount = React.useMemo(() => {
    return queue.filter(
      (item) => item.status === "GRACE_PERIOD" || item.dunningStage === "GRACE_PERIOD"
    ).length;
  }, [queue]);

  const lockoutCount = React.useMemo(() => {
    return queue.filter(
      (item) =>
        item.status === "RESTRICTED_READ_ONLY" ||
        item.dunningStage === "RESTRICTED_READ_ONLY"
    ).length;
  }, [queue]);

  const failedLogsCount = React.useMemo(() => {
    return logs.filter((l) => l.status?.toUpperCase() === "FAILED").length;
  }, [logs]);

  // Filtered Queue
  const filteredQueue = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return queue;
    return queue.filter(
      (item) =>
        item.organizationName?.toLowerCase().includes(q) ||
        item.organizationSlug?.toLowerCase().includes(q) ||
        item.planName?.toLowerCase().includes(q) ||
        item.billingContactEmail?.toLowerCase().includes(q)
    );
  }, [queue, searchQuery]);

  // Filtered Logs
  const filteredLogs = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.organizationName?.toLowerCase().includes(q) ||
        l.organizationSlug?.toLowerCase().includes(q) ||
        l.recipient?.toLowerCase().includes(q) ||
        l.subject?.toLowerCase().includes(q) ||
        l.channel?.toLowerCase().includes(q)
    );
  }, [logs, searchQuery]);

  const handleRefresh = () => {
    if (activeTab === "queue") {
      refetchQueue();
    } else {
      refetchLogs();
    }
  };

  const handleTriggerConfirm = async () => {
    if (!reminderTarget) return;
    try {
      await triggerMutation.mutateAsync({
        orgId: reminderTarget.organizationId,
        licenseId: reminderTarget.licenseId,
      });
      toast.success(
        t("billing.reminder_success", { orgName: reminderTarget.organizationName })
      );
      setReminderTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to dispatch reminder";
      toast.error(msg);
    }
  };

  const handleRetryConfirm = async () => {
    if (!retryTarget) return;
    try {
      await retryMutation.mutateAsync(retryTarget.id);
      toast.success(t("billing.retry_success"));
      setRetryTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to retry notification";
      toast.error(msg);
    }
  };

  const isLoading = activeTab === "queue" ? isQueueLoading : isLogsLoading;

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      {/* Header Command Hero */}
      <PageHero
        bordered={false}
        className="pb-0"
        eyebrow={t("nav.billing_ops", { ns: "nav" })}
        title={t("billing.renewals_title")}
        icon={Bell}
        subtitle={t("billing.renewals_page_desc")}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground/90 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{queue.length}</span>
              <span>{t("billing.tab_renewal_queue")}</span>
            </div>
            <span className="text-muted-foreground/30 px-1">/</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{logs.length}</span>
              <span>{t("billing.tab_dispatch_logs")}</span>
            </div>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-1.5 h-7 px-2.5 text-xs font-medium border-border/80 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            >
              <RefreshCcw className={`size-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
              <span>{t("common.refresh")}</span>
            </Button>
          </div>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card glowingEffect className="p-4 bg-card border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("billing.renewals_kpi_due_30d")}
            </span>
            <p className="text-2xl font-bold font-mono text-foreground">{due30dCount}</p>
            <span className="text-[10px] text-muted-foreground">
              {t("billing.renewals_kpi_due_30d_desc")}
            </span>
          </div>
          <div className="size-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <Clock className="size-4" />
          </div>
        </Card>

        <Card glowingEffect className="p-4 bg-card border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("billing.renewals_kpi_grace")}
            </span>
            <p className={`text-2xl font-bold font-mono ${graceCount > 0 ? "text-amber-500" : "text-foreground"}`}>
              {graceCount}
            </p>
            <span className="text-[10px] text-muted-foreground">
              {t("billing.renewals_kpi_grace_desc")}
            </span>
          </div>
          <div className="size-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <AlertTriangle className="size-4" />
          </div>
        </Card>

        <Card glowingEffect className="p-4 bg-card border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("billing.renewals_kpi_lockout")}
            </span>
            <p className={`text-2xl font-bold font-mono ${lockoutCount > 0 ? "text-destructive" : "text-foreground"}`}>
              {lockoutCount}
            </p>
            <span className="text-[10px] text-muted-foreground">
              {t("billing.renewals_kpi_lockout_desc")}
            </span>
          </div>
          <div className="size-9 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
            <ShieldAlert className="size-4" />
          </div>
        </Card>

        <Card glowingEffect className="p-4 bg-card border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("billing.renewals_kpi_failed_logs")}
            </span>
            <p className={`text-2xl font-bold font-mono ${failedLogsCount > 0 ? "text-destructive" : "text-foreground"}`}>
              {failedLogsCount}
            </p>
            <span className="text-[10px] text-muted-foreground">
              {t("billing.renewals_kpi_failed_logs_desc")}
            </span>
          </div>
          <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <RotateCw className="size-4" />
          </div>
        </Card>
      </div>

      {/* Toolbar: Segmented Tabs & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Tab Switcher */}
        <div className="inline-flex p-0.5 rounded-md border border-border bg-muted/20">
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`h-7 px-3 rounded text-xs font-medium transition-all ${
              activeTab === "queue"
                ? "bg-foreground text-background shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("billing.tab_renewal_queue")} ({queue.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`h-7 px-3 rounded text-xs font-medium transition-all ${
              activeTab === "logs"
                ? "bg-foreground text-background shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("billing.tab_dispatch_logs")} ({logs.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "queue"
                ? t("billing.search_invoices_placeholder")
                : t("common.search")
            }
            className="w-full h-8 pl-8 pr-2.5 rounded-md border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === "queue" ? (
        <RenewalQueueTable
          queue={filteredQueue}
          isLoading={isQueueLoading}
          onTriggerReminder={(item) => setReminderTarget(item)}
        />
      ) : (
        <DispatchLogsTable
          logs={filteredLogs}
          isLoading={isLogsLoading}
          onViewPayload={(log) => setSelectedPayloadLog(log)}
          onRetry={(log) => setRetryTarget(log)}
        />
      )}

      {/* Trigger Reminder Dialog */}
      <TriggerReminderDialog
        item={reminderTarget}
        onClose={() => setReminderTarget(null)}
        onConfirm={handleTriggerConfirm}
        isPending={triggerMutation.isPending}
      />

      {/* Retry Dispatch Dialog */}
      <RetryDispatchDialog
        log={retryTarget}
        onClose={() => setRetryTarget(null)}
        onConfirm={handleRetryConfirm}
        isPending={retryMutation.isPending}
      />

      {/* Payload Details Dialog */}
      <LogPayloadDetailDialog
        log={selectedPayloadLog}
        onClose={() => setSelectedPayloadLog(null)}
      />
    </PageLayout>
  );
}
