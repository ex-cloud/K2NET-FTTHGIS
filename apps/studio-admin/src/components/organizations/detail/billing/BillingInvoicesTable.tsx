import * as React from "react";
import {
  Badge,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  ActionTooltip,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@k2net/ui";
import {
  Download,
  CheckCircle2,
  FileText,
  Copy,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import type { TenantInvoice } from "./billing-types";

interface BillingInvoicesTableProps {
  invoices: TenantInvoice[];
  picEmail?: string;
}

export function BillingInvoicesTable({
  invoices,
  picEmail,
}: BillingInvoicesTableProps) {
  const { t } = useTranslation();

  const handleDownloadPdf = (inv: TenantInvoice) => {
    toast.success(`Mengunduh berkas invoice ${inv.invoiceNumber}...`, {
      description: "PDF diterbitkan oleh payment-gateway:5002.",
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("organizations.copied_to_clipboard", { label }));
  };

  const handleResendReceipt = (inv: TenantInvoice) => {
    toast.success(`Kwitansi invoice ${inv.invoiceNumber} dikirim ulang ke ${picEmail || "PIC Organisasi"}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-4 border-t border-border/60">
      <div className="lg:col-span-4 space-y-1">
        <h4 className="text-sm font-bold text-foreground">{t("billing.past_invoices")}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("billing.invoices_desc")}
        </p>
      </div>

      <div className="lg:col-span-8">
        <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs">
          <div className="py-2.5 px-4 border-b border-border/80 bg-muted/20 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
              {t("billing.past_invoices")} ({invoices.length})
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">IDR (Rupiah)</span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 border-b border-border/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-4">
                    {t("billing.invoice_number")}
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("billing.invoice_date")}
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("billing.invoice_amount")}
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("billing.invoice_status")}
                  </TableHead>
                  <TableHead className="text-right pr-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("billing.invoice_action")}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {invoices.map((inv) => (
                  <ContextMenu key={inv.id}>
                    <ContextMenuTrigger asChild>
                      <TableRow className="border-b border-border/50 text-xs hover:bg-muted/30 cursor-pointer">
                        <TableCell className="pl-4 py-3 font-mono font-bold text-foreground">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{inv.invoiceNumber}</span>
                          </div>
                        </TableCell>

                        <TableCell className="py-3 font-mono text-muted-foreground">{inv.date}</TableCell>

                        <TableCell className="py-3 font-mono font-semibold text-foreground">{inv.amount}</TableCell>

                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px] gap-1 px-2 py-0.5"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{inv.status}</span>
                          </Badge>
                        </TableCell>

                        <TableCell className="py-3 pr-4 text-right">
                          <ActionTooltip label={`Unduh kuitansi PDF ${inv.invoiceNumber}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPdf(inv)}
                              className="h-6 text-[11px] border-border bg-card hover:bg-accent text-foreground gap-1 px-2 font-mono"
                            >
                              <Download className="h-3 w-3" />
                              <span>PDF</span>
                            </Button>
                          </ActionTooltip>
                        </TableCell>
                      </TableRow>
                    </ContextMenuTrigger>

                    <ContextMenuContent className="w-64 bg-popover/95 backdrop-blur-xl border-border/80 shadow-lg text-xs z-[9999] py-1.5 rounded-xl">
                      <ContextMenuItem
                        onClick={() => handleDownloadPdf(inv)}
                        className="cursor-pointer font-semibold text-primary focus:bg-primary/10 focus:text-primary gap-2"
                      >
                        <Download className="w-3.5 h-3.5 text-primary" />
                        <span>{t("billing.download_pdf")}</span>
                      </ContextMenuItem>

                      <ContextMenuItem
                        onClick={() => handleResendReceipt(inv)}
                        className="cursor-pointer font-medium text-foreground focus:bg-accent gap-2"
                      >
                        <Mail className="w-3.5 h-3.5 text-blue-500" />
                        <span>{t("billing.resend_to_pic")}</span>
                      </ContextMenuItem>

                      <ContextMenuSeparator className="bg-border/40 my-1" />

                      <ContextMenuItem
                        onClick={() => handleCopy(inv.invoiceNumber, t("billing.invoice_number"))}
                        className="cursor-pointer gap-2 focus:bg-muted"
                      >
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{t("billing.copy_number", { number: inv.invoiceNumber })}</span>
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
