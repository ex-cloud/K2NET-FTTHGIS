import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  toast,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Receipt, Building2, Calendar, CreditCard, DollarSign } from "lucide-react";
import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import { useCreateBillingInvoice } from "@/hooks/useBillingInvoices";

export interface CreateInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateInvoiceModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateInvoiceModalProps) {
  const { t } = useTranslation();
  const { organizations = [], loading: isOrgsLoading } = useOrganizations();
  const createInvoiceMutation = useCreateBillingInvoice();

  const [selectedOrgId, setSelectedOrgId] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [amount, setAmount] = React.useState<number>(1000000);
  const [dueDays, setDueDays] = React.useState<number>(14);
  const [paymentMethod, setPaymentMethod] = React.useState<string>("XENDIT_INVOICE");
  const [notes, setNotes] = React.useState<string>("");
  const [validationError, setValidationError] = React.useState<string | null>(null);

  // Auto-select first org if available
  React.useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      const firstActive = organizations.find((o: Organization) => o.id && o.slug !== "default") || organizations[0];
      if (firstActive?.id) {
        setSelectedOrgId(firstActive.id);
      }
    }
  }, [organizations, selectedOrgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedOrgId) {
      setValidationError("Please select a tenant organization.");
      return;
    }

    if (!description.trim()) {
      setValidationError("Description is required.");
      return;
    }

    if (!amount || amount <= 0) {
      setValidationError("Amount must be greater than 0.");
      return;
    }

    try {
      await createInvoiceMutation.mutateAsync({
        organizationId: selectedOrgId,
        description: description.trim(),
        amount: Number(amount),
        dueDays: Number(dueDays) || 14,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      toast.success(t("billing.create_invoice_success"));
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create invoice";
      toast.error(msg);
      setValidationError(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-card border-border text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Receipt className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {t("billing.create_invoice_modal_title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("billing.create_invoice_modal_desc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {validationError && (
            <div className="p-2.5 rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-xs">
              {validationError}
            </div>
          )}

          {/* Tenant Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Building2 className="size-3.5 text-muted-foreground" />
              <span>{t("billing.form_select_tenant")}</span>
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              disabled={isOrgsLoading || createInvoiceMutation.isPending}
              className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            >
              <option value="" disabled>
                -- {t("billing.form_select_tenant")} --
              </option>
              {organizations
                .filter((o: Organization): o is Organization & { id: string } => !!o.id)
                .map((org: Organization & { id: string }) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.slug}) {org.plan ? `· ${org.plan}` : ""}
                  </option>
                ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              {t("billing.form_description")}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Enterprise License Subscription - 1 Year"
              disabled={createInvoiceMutation.isPending}
              className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Amount & Due Term */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <DollarSign className="size-3.5 text-muted-foreground" />
                <span>{t("billing.form_amount")}</span>
              </label>
              <input
                type="number"
                min={0}
                step={50000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                disabled={createInvoiceMutation.isPending}
                className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground" />
                <span>{t("billing.form_due_days")}</span>
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={dueDays}
                onChange={(e) => setDueDays(Number(e.target.value))}
                disabled={createInvoiceMutation.isPending}
                className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <CreditCard className="size-3.5 text-muted-foreground" />
              <span>{t("billing.form_payment_method")}</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={createInvoiceMutation.isPending}
              className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="XENDIT_INVOICE">Xendit Virtual Account & QRIS (Online)</option>
              <option value="BANK_TRANSFER">Direct Corporate Bank Transfer (Manual)</option>
              <option value="MANUAL_OFFLINE">Corporate Offline Cash / Cheque</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              {t("billing.form_notes")}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Approved under Enterprise SLA Q4 contract"
              disabled={createInvoiceMutation.isPending}
              className="w-full p-2 rounded-md border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={createInvoiceMutation.isPending}
              className="h-7 px-2.5 text-xs font-medium"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createInvoiceMutation.isPending || isOrgsLoading}
              className="h-7 px-2.5 text-xs font-medium gap-1.5"
            >
              <Receipt className="size-3.5" />
              <span>{createInvoiceMutation.isPending ? t("common.processing") : t("billing.btn_submit_invoice")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
