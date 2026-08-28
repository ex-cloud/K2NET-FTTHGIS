"use client";

import {
  Badge,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Card,
  ActionTooltip,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@k2net/ui";
import {
  CreditCard,
  Download,
  CheckCircle2,
  FileText,
  Copy,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../types";

interface OrgBillingTabProps {
  organization: EnrichedOrganization;
  onOpenPlanUpgrade?: () => void;
}

interface TenantInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  description: string;
  amount: string;
  status: "PAID" | "PENDING";
  paymentMethod: string;
}

export function OrgBillingTab({
  organization: org,
  onOpenPlanUpgrade,
}: OrgBillingTabProps) {
  // Mock tenant-specific invoices history
  const invoices: TenantInvoice[] = [
    {
      id: "inv-1",
      invoiceNumber: `INV-${new Date().getFullYear()}-08-0042`,
      date: "01 Aug 2026",
      description: `K2NET FTTH GIS SaaS Subscription — ${org.planTier} Tier (Aug 2026)`,
      amount: org.planTier === "Enterprise" ? "Rp 12.500.000" : org.planTier === "Professional" ? "Rp 4.500.000" : "Rp 1.500.000",
      status: "PAID",
      paymentMethod: "Xendit Virtual Account BCA",
    },
    {
      id: "inv-2",
      invoiceNumber: `INV-${new Date().getFullYear()}-07-0038`,
      date: "01 Jul 2026",
      description: `K2NET FTTH GIS SaaS Subscription — ${org.planTier} Tier (Jul 2026)`,
      amount: org.planTier === "Enterprise" ? "Rp 12.500.000" : org.planTier === "Professional" ? "Rp 4.500.000" : "Rp 1.500.000",
      status: "PAID",
      paymentMethod: "Xendit Virtual Account BCA",
    },
    {
      id: "inv-3",
      invoiceNumber: `INV-${new Date().getFullYear()}-06-0029`,
      date: "01 Jun 2026",
      description: `K2NET FTTH GIS SaaS Subscription — ${org.planTier} Tier (Jun 2026)`,
      amount: org.planTier === "Enterprise" ? "Rp 12.500.000" : org.planTier === "Professional" ? "Rp 4.500.000" : "Rp 1.500.000",
      status: "PAID",
      paymentMethod: "Xendit Virtual Account Mandiri",
    },
  ];

  const handleDownloadPdf = (inv: TenantInvoice) => {
    toast.success(`Downloading invoice receipt ${inv.invoiceNumber}...`, {
      description: "PDF generated via billing gateway service.",
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleResendReceipt = (inv: TenantInvoice) => {
    toast.success(`Invoice ${inv.invoiceNumber} receipt resent to ${org.picEmail}`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Subscription & Payment Overview Card */}
      <Card className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Active Subscription & Billing Details</h3>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px]">
              {org.planTier} PLAN
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Riwayat pembayaran tagihan bulanan dan status lisensi FTTH GIS khusus organisasi ini.
          </p>
        </div>

        <ActionTooltip label="Upgrade or downgrade subscription plan tier">
          <Button
            size="sm"
            onClick={onOpenPlanUpgrade}
            className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shrink-0"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Change Subscription Tier</span>
          </Button>
        </ActionTooltip>
      </Card>

      {/* 2. Billing Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-foreground/75 dark:text-muted-foreground font-bold">Current Monthly Cost</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-foreground">
              {org.planTier === "Enterprise" ? "Rp 12.500.000" : org.planTier === "Professional" ? "Rp 4.500.000" : "Rp 1.500.000"}
            </span>
            <span className="text-xs text-muted-foreground">/ bln</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Termasuk PPN 11% & SLA Support</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-foreground/75 dark:text-muted-foreground font-bold">Next Invoice Date</span>
          <span className="text-xl font-bold font-mono text-foreground block">01 September 2026</span>
          <span className="text-[10px] text-muted-foreground">Otomatis diterbitkan melalui email PIC</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-foreground/75 dark:text-muted-foreground font-bold">Payment Method</span>
          <span className="text-xl font-bold font-mono text-foreground block">Xendit Gateway</span>
          <span className="text-[10px] text-primary flex items-center gap-1 font-mono">
            <CheckCircle2 className="h-3 w-3" />
            <span>Auto-settlement active</span>
          </span>
        </Card>
      </div>

      {/* 3. Invoices History Table */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs">
        <div className="py-3 px-4 border-b border-border/80 bg-muted/20 flex items-center justify-between">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
            Invoice History ({invoices.length})
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            Currency: IDR (Rupiah)
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40 border-b border-border/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-6">
                  Invoice Number
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Issue Date
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Description
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Amount
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-right pr-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {invoices.map((inv) => (
                <ContextMenu key={inv.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow className="border-b border-border/50 text-xs hover:bg-muted/30 cursor-pointer">
                      <TableCell className="pl-6 py-3.5 font-mono font-bold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{inv.invoiceNumber}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 font-mono text-muted-foreground">
                        {inv.date}
                      </TableCell>

                      <TableCell className="py-3.5 text-foreground max-w-[280px] truncate">
                        {inv.description}
                      </TableCell>

                      <TableCell className="py-3.5 font-mono font-semibold text-foreground">
                        {inv.amount}
                      </TableCell>

                      <TableCell className="py-3.5">
                        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px] gap-1 px-2 py-0.5">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{inv.status}</span>
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3.5 pr-6 text-right">
                        <ActionTooltip label={`Download PDF receipt for ${inv.invoiceNumber}`} shortcut="D">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPdf(inv)}
                            className="h-7 text-xs border-border bg-card hover:bg-accent text-foreground gap-1.5 px-2.5 font-mono"
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
                      <ContextMenuShortcut>D</ContextMenuShortcut>
                    </ContextMenuItem>

                    <ContextMenuItem
                      onClick={() => handleResendReceipt(inv)}
                      className="cursor-pointer font-medium text-foreground focus:bg-accent gap-2"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      <span>Resend Receipt to PIC</span>
                    </ContextMenuItem>

                    <ContextMenuSeparator className="bg-border/40 my-1" />

                    <ContextMenuItem
                      onClick={() => handleCopy(inv.invoiceNumber, "Invoice number")}
                      className="cursor-pointer gap-2 focus:bg-muted"
                    >
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Copy Invoice ({inv.invoiceNumber})</span>
                      <ContextMenuShortcut>C</ContextMenuShortcut>
                    </ContextMenuItem>

                    <ContextMenuItem
                      onClick={() => handleCopy(inv.amount, "Invoice amount")}
                      className="cursor-pointer gap-2 focus:bg-muted"
                    >
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Copy Amount ({inv.amount})</span>
                    </ContextMenuItem>

                    {onOpenPlanUpgrade && (
                      <>
                        <ContextMenuSeparator className="bg-border/40 my-1" />
                        <ContextMenuItem
                          onClick={onOpenPlanUpgrade}
                          className="cursor-pointer gap-2 focus:bg-muted"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Change Subscription Tier</span>
                        </ContextMenuItem>
                      </>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
