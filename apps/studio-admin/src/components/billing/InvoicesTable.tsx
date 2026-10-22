import * as React from "react";
import { Card, Button } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Receipt, RefreshCcw, ExternalLink, Check, Ban } from "lucide-react";
import { LifecycleStatusBadge } from "@/components/common/LifecycleStatusBadge";
import { formatIdr } from "@/lib/formatters";
import type { BillingInvoiceItem } from "@/hooks/useBillingInvoices";

export interface InvoicesTableProps {
  invoices: BillingInvoiceItem[];
  isLoading: boolean;
  onSettle: (inv: BillingInvoiceItem) => void;
  onCancel: (inv: BillingInvoiceItem) => void;
}

export function InvoicesTable({
  invoices,
  isLoading,
  onSettle,
  onCancel,
}: InvoicesTableProps) {
  const { t } = useTranslation();

  return (
    <Card className="border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-muted-foreground font-medium">
              <th className="py-2.5 px-3 font-medium">{t("billing.th_invoice_num")}</th>
              <th className="py-2.5 px-3 font-medium">{t("billing.th_tenant")}</th>
              <th className="py-2.5 px-3 font-medium">{t("billing.form_description")}</th>
              <th className="py-2.5 px-3 font-medium">{t("billing.th_amount")}</th>
              <th className="py-2.5 px-3 font-medium">{t("billing.th_due_date")}</th>
              <th className="py-2.5 px-3 font-medium">{t("billing.th_method")}</th>
              <th className="py-2.5 px-3 font-medium">{t("billing.th_status")}</th>
              <th className="py-2.5 px-3 font-medium text-right">{t("billing.th_actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  <RefreshCcw className="size-5 animate-spin mx-auto mb-2 text-primary" />
                  <span>{t("common.loading")}</span>
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  <Receipt className="size-6 mx-auto mb-2 opacity-40" />
                  <p>{t("billing.empty_invoices")}</p>
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const isOverdue =
                  inv.status === "PENDING" &&
                  inv.dueDate &&
                  new Date(inv.dueDate).getTime() < new Date().getTime();

                const displayStatus = isOverdue ? "OVERDUE" : inv.status;

                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    {/* Invoice Number */}
                    <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                      {inv.invoiceNumber}
                    </td>

                    {/* Tenant Organization */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {inv.organizationName || "Unknown"}
                        </span>
                        {inv.organizationSlug && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {inv.organizationSlug}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-2.5 px-3 text-muted-foreground max-w-[200px] truncate">
                      {inv.description || "—"}
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 font-mono font-semibold text-foreground">
                      {formatIdr(Number(inv.amount))}
                    </td>

                    {/* Due Date */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span
                          className={`font-mono ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}
                        >
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                        </span>
                        {inv.paidAt && (
                          <span className="text-[10px] text-primary font-mono">
                            Paid: {new Date(inv.paidAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {inv.paymentMethod || "—"}
                        {inv.paymentChannel ? ` (${inv.paymentChannel})` : ""}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3">
                      <LifecycleStatusBadge status={displayStatus} size="xs" />
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.externalInvoiceUrl && (
                          <a
                            href={inv.externalInvoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center h-6 px-2 text-[11px] font-medium rounded border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all gap-1"
                            title={t("billing.action_pay_link")}
                          >
                            <ExternalLink className="size-3" />
                            <span>{t("billing.action_pay_link")}</span>
                          </a>
                        )}

                        {(inv.status === "PENDING" || displayStatus === "OVERDUE") && (
                          <>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => onSettle(inv)}
                              className="h-6 px-2 text-[11px] font-medium border-primary/40 text-primary hover:bg-primary/10 gap-1"
                            >
                              <Check className="size-3" />
                              <span>{t("billing.action_settle")}</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => onCancel(inv)}
                              className="h-6 px-2 text-[11px] font-medium border-destructive/40 text-destructive hover:bg-destructive/10 gap-1"
                            >
                              <Ban className="size-3" />
                              <span>{t("billing.action_cancel")}</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
