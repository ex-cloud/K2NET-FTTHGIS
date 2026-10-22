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
  Receipt,
  Plus,
  RefreshCcw,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  useBillingInvoices,
  useSettleBillingInvoice,
  useCancelBillingInvoice,
  type BillingInvoiceItem,
} from "@/hooks/useBillingInvoices";
import { CreateInvoiceModal } from "@/components/billing/CreateInvoiceModal";
import { InvoicesTable } from "@/components/billing/InvoicesTable";
import { InvoiceSettleConfirmDialog } from "@/components/billing/InvoiceSettleConfirmDialog";
import { InvoiceCancelConfirmDialog } from "@/components/billing/InvoiceCancelConfirmDialog";
import { formatIdr } from "@/lib/formatters";

export default function BillingInvoicesPage() {
  const { t } = useTranslation();

  const {
    data: invoices = [],
    isLoading,
    refetch,
  } = useBillingInvoices();

  const settleMutation = useSettleBillingInvoice();
  const cancelMutation = useCancelBillingInvoice();

  // State
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // Confirmation dialogs
  const [invoiceToSettle, setInvoiceToSettle] = React.useState<BillingInvoiceItem | null>(null);
  const [invoiceToCancel, setInvoiceToCancel] = React.useState<BillingInvoiceItem | null>(null);

  // KPIs
  const totalInvoiced = React.useMemo(() => {
    return invoices
      .filter((inv) => inv.status !== "CANCELLED")
      .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  }, [invoices]);

  const outstandingTotal = React.useMemo(() => {
    return invoices
      .filter((inv) => inv.status === "PENDING")
      .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  }, [invoices]);

  const overdueCount = React.useMemo(() => {
    const now = new Date().getTime();
    return invoices.filter((inv) => {
      if (inv.status === "OVERDUE") return true;
      if (inv.status === "PENDING" && inv.dueDate) {
        return new Date(inv.dueDate).getTime() < now;
      }
      return false;
    }).length;
  }, [invoices]);

  const collectedTotal = React.useMemo(() => {
    return invoices
      .filter((inv) => inv.status === "PAID")
      .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  }, [invoices]);

  // Filtered Invoices
  const filteredInvoices = React.useMemo(() => {
    const now = new Date().getTime();
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.organizationName && inv.organizationName.toLowerCase().includes(q)) ||
        (inv.organizationSlug && inv.organizationSlug.toLowerCase().includes(q)) ||
        (inv.description && inv.description.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === "ALL") return true;
      if (statusFilter === "OVERDUE") {
        return (
          inv.status === "OVERDUE" ||
          (inv.status === "PENDING" && inv.dueDate && new Date(inv.dueDate).getTime() < now)
        );
      }
      return inv.status === statusFilter;
    });
  }, [invoices, searchQuery, statusFilter]);

  const handleSettleConfirm = async () => {
    if (!invoiceToSettle) return;
    try {
      await settleMutation.mutateAsync({
        invoiceId: invoiceToSettle.id,
        paymentMethod: "MANUAL_SETTLEMENT",
        paymentChannel: "ADMIN_OVERRIDE",
      });
      toast.success(
        t("billing.settle_success", { invoiceNumber: invoiceToSettle.invoiceNumber })
      );
      setInvoiceToSettle(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to settle invoice";
      toast.error(msg);
    }
  };

  const handleCancelConfirm = async () => {
    if (!invoiceToCancel) return;
    try {
      await cancelMutation.mutateAsync({
        invoiceId: invoiceToCancel.id,
        reason: "Administrative cancellation",
      });
      toast.success(
        t("billing.cancel_success", { invoiceNumber: invoiceToCancel.invoiceNumber })
      );
      setInvoiceToCancel(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel invoice";
      toast.error(msg);
    }
  };

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      {/* Header Command Hero */}
      <PageHero
        bordered={false}
        className="pb-0"
        eyebrow="BILLING"
        title={t("billing.invoices_title")}
        icon={Receipt}
        subtitle={t("billing.invoices_page_desc")}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground/90 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{invoices.length}</span>
              <span>{t("billing.total_accounts")}</span>
            </div>
            <span className="text-muted-foreground/30 px-1">/</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{formatIdr(collectedTotal)}</span>
              <span>{t("billing.invoices_kpi_collected")}</span>
            </div>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-1.5 h-7 px-2.5 text-xs font-medium border-border/80 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            >
              <RefreshCcw className={`size-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
              <span>{t("common.refresh")}</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="gap-1.5 h-7 px-2.5 text-xs font-medium"
            >
              <Plus className="size-3.5" />
              <span>{t("billing.invoices_create_btn")}</span>
            </Button>
          </div>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card glowingEffect className="p-4 bg-card border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("billing.invoices_kpi_total_invoiced")}
            </span>
            <p className="text-xl font-bold font-mono text-foreground">{formatIdr(totalInvoiced)}</p>
            <span className="text-[10px] text-muted-foreground">
              {t("billing.invoices_kpi_total_invoiced_desc")}
            </span>
          </div>
          <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Receipt className="size-4" />
          </div>
        </Card>

        <Card glowingEffect className="p-4 bg-card border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("billing.invoices_kpi_outstanding")}
            </span>
            <p className="text-xl font-bold font-mono text-foreground">{formatIdr(outstandingTotal)}</p>
            <span className="text-[10px] text-muted-foreground">
              {t("billing.invoices_kpi_outstanding_desc")}
            </span>
          </div>
          <div className="size-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <Clock className="size-4" />
          </div>
        </Card>

        <Card glowingEffect className="p-4 bg-card border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("billing.invoices_kpi_overdue")}
            </span>
            <p className={`text-2xl font-bold font-mono ${overdueCount > 0 ? "text-destructive" : "text-foreground"}`}>
              {overdueCount}
            </p>
            <span className="text-[10px] text-muted-foreground">
              {t("billing.invoices_kpi_overdue_desc")}
            </span>
          </div>
          <div className="size-9 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
            <AlertTriangle className="size-4" />
          </div>
        </Card>

        <Card glowingEffect className="p-4 bg-card border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("billing.invoices_kpi_collected")}
            </span>
            <p className="text-xl font-bold font-mono text-foreground">{formatIdr(collectedTotal)}</p>
            <span className="text-[10px] text-muted-foreground">
              {t("billing.invoices_kpi_collected_desc")}
            </span>
          </div>
          <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <CheckCircle2 className="size-4" />
          </div>
        </Card>
      </div>

      {/* Toolbar: Search & Status Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="inline-flex p-0.5 rounded-md border border-border bg-muted/20">
          {(["ALL", "PENDING", "PAID", "OVERDUE", "CANCELLED"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`h-7 px-3 rounded text-xs font-medium transition-all ${
                statusFilter === st
                  ? "bg-foreground text-background shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {st === "ALL" && t("billing.filter_all")}
              {st === "PENDING" && t("billing.filter_pending")}
              {st === "PAID" && t("billing.filter_paid")}
              {st === "OVERDUE" && t("billing.filter_overdue")}
              {st === "CANCELLED" && t("billing.filter_cancelled")}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("billing.search_invoices_placeholder")}
            className="w-full h-8 pl-8 pr-2.5 rounded-md border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <InvoicesTable
        invoices={filteredInvoices}
        isLoading={isLoading}
        onSettle={(inv) => setInvoiceToSettle(inv)}
        onCancel={(inv) => setInvoiceToCancel(inv)}
      />

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => refetch()}
      />

      {/* Settle Confirmation Dialog */}
      <InvoiceSettleConfirmDialog
        invoice={invoiceToSettle}
        onClose={() => setInvoiceToSettle(null)}
        onConfirm={handleSettleConfirm}
        isPending={settleMutation.isPending}
      />

      {/* Cancel Confirmation Dialog */}
      <InvoiceCancelConfirmDialog
        invoice={invoiceToCancel}
        onClose={() => setInvoiceToCancel(null)}
        onConfirm={handleCancelConfirm}
        isPending={cancelMutation.isPending}
      />
    </PageLayout>
  );
}
