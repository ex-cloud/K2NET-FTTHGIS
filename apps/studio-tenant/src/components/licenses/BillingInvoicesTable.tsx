import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { ExternalLink, Receipt, CheckCircle, Clock, AlertTriangle, FileText } from "lucide-react";
import type { BillingInvoiceItem } from "../../hooks/useTenantLicense";

interface BillingInvoicesTableProps {
  invoices: BillingInvoiceItem[];
  isLoading: boolean;
}

export function BillingInvoicesTable({ invoices, isLoading }: BillingInvoicesTableProps) {
  const { t, formatCurrency, formatDate } = useTranslation();

  const renderStatusBadge = (status: BillingInvoiceItem["status"]) => {
    switch (status) {
      case "PAID":
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-mono gap-1 border-border/80 bg-muted/40 text-foreground"
          >
            <CheckCircle className="h-3 w-3 text-foreground" />
            {t("common.verified")}
          </Badge>
        );
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-mono gap-1 border-border/60 bg-muted/20 text-foreground/80"
          >
            <Clock className="h-3 w-3 text-muted-foreground" />
            {t("common.pending")}
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-mono gap-1 border-border text-foreground"
          >
            <AlertTriangle className="h-3 w-3 text-foreground" />
            {t("common.warning")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] font-mono border-border/60 text-muted-foreground">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-2xs">
      <div className="p-4 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/40 border border-border/60 text-foreground">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              {t("license.tenant.invoices_title")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("license.tenant.invoices_desc")}
            </p>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border/80 bg-muted/25 hover:bg-muted/25">
            <TableHead className="text-[11px] font-semibold text-foreground h-8">
              {t("license.tenant.invoice_number")}
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-foreground h-8">
              {t("common.details")}
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-foreground h-8">
              {t("license.tenant.invoice_amount")}
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-foreground h-8">
              {t("license.tenant.invoice_status")}
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-foreground h-8">
              {t("license.tenant.invoice_due_date")}
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-foreground h-8">
              {t("license.tenant.invoice_paid_at")}
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-foreground h-8 text-right pr-4">
              {t("common.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                {t("common.loading")}
              </TableCell>
            </TableRow>
          ) : invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                <div className="flex flex-col items-center justify-center gap-1">
                  <FileText className="h-6 w-6 text-muted-foreground/40 mb-1" />
                  <p className="font-medium text-foreground">{t("license.tenant.no_invoices")}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((inv) => (
              <TableRow key={inv.id} className="border-border/60 hover:bg-muted/15 transition-colors">
                <TableCell className="py-2.5 text-xs font-mono font-medium text-foreground">
                  {inv.invoiceNumber}
                </TableCell>
                <TableCell className="py-2.5 text-xs text-muted-foreground max-w-xs truncate">
                  {inv.description || "—"}
                </TableCell>
                <TableCell className="py-2.5 text-xs font-mono font-semibold text-foreground">
                  {formatCurrency(inv.amount)}
                </TableCell>
                <TableCell className="py-2.5 text-xs">
                  {renderStatusBadge(inv.status)}
                </TableCell>
                <TableCell className="py-2.5 text-xs font-mono text-muted-foreground">
                  {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                </TableCell>
                <TableCell className="py-2.5 text-xs font-mono text-muted-foreground">
                  {inv.paidAt ? formatDate(inv.paidAt) : "—"}
                </TableCell>
                <TableCell className="py-2.5 text-xs text-right pr-4">
                  {inv.status === "PENDING" && inv.externalInvoiceUrl ? (
                    <Button
                      size="xs"
                      variant="default"
                      onClick={() => window.open(inv.externalInvoiceUrl || "#", "_blank")}
                      className="h-6 px-2 text-[11px] font-medium gap-1 rounded-md shadow-xs bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>{t("license.tenant.invoice_action_pay")}</span>
                    </Button>
                  ) : inv.externalInvoiceUrl ? (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => window.open(inv.externalInvoiceUrl || "#", "_blank")}
                      className="h-6 px-2 text-[11px] font-medium gap-1 rounded-md border-border/80"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>{t("license.tenant.invoice_action_view")}</span>
                    </Button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground font-mono">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
