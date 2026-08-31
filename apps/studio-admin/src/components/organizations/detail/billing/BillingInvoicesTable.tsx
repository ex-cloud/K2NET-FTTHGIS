

import React from "react";
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
import type { TenantInvoice } from "./billing-types";

interface BillingInvoicesTableProps {
  invoices: TenantInvoice[];
  picEmail?: string;
}

export function BillingInvoicesTable({
  invoices,
  picEmail,
}: BillingInvoicesTableProps) {
  const handleDownloadPdf = (inv: TenantInvoice) => {
    toast.success(`Mengunduh berkas invoice ${inv.invoiceNumber}...`, {
      description: "PDF diterbitkan oleh payment-gateway:5002.",
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard`);
  };

  const handleResendReceipt = (inv: TenantInvoice) => {
    toast.success(`Kwitansi invoice ${inv.invoiceNumber} dikirim ulang ke ${picEmail || "PIC Organisasi"}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-4 border-t border-border/60">
      <div className="lg:col-span-4 space-y-1">
        <h4 className="text-sm font-bold text-foreground">Past Invoices</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Riwayat penerbitan tagihan bulanan dan kuitansi pembayaran yang diproses melalui gateway Xendit.
        </p>
      </div>

      <div className="lg:col-span-8">
        <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs">
          <div className="py-2.5 px-4 border-b border-border/80 bg-muted/20 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
              Invoice History ({invoices.length})
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">IDR (Rupiah)</span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 border-b border-border/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-4">
                    Nomor Invoice
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Tanggal
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Nominal
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-right pr-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Aksi
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

                    <ContextMenuContent className="w-64 bg-popover/95 backdrop-blur-xl border-border/80 shadow-2xl text-xs z-[9999] py-1.5 rounded-xl">
                      <ContextMenuItem
                        onClick={() => handleDownloadPdf(inv)}
                        className="cursor-pointer font-semibold text-primary focus:bg-primary/10 focus:text-primary gap-2"
                      >
                        <Download className="w-3.5 h-3.5 text-primary" />
                        <span>Download PDF Invoice</span>
                      </ContextMenuItem>

                      <ContextMenuItem
                        onClick={() => handleResendReceipt(inv)}
                        className="cursor-pointer font-medium text-foreground focus:bg-accent gap-2"
                      >
                        <Mail className="w-3.5 h-3.5 text-blue-500" />
                        <span>Kirim Ulang ke PIC</span>
                      </ContextMenuItem>

                      <ContextMenuSeparator className="bg-border/40 my-1" />

                      <ContextMenuItem
                        onClick={() => handleCopy(inv.invoiceNumber, "Nomor Invoice")}
                        className="cursor-pointer gap-2 focus:bg-muted"
                      >
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Salin Nomor ({inv.invoiceNumber})</span>
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
