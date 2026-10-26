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
  Clock,
  AlertTriangle,
  XCircle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import type { TenantInvoice } from "./billing-types";

function InvoiceStatusBadge({ status }: { status: string }) {
  if (status === "PAID") {
    return (
      <Badge
        variant="outline"
        className="border-green-500/30 bg-green-500/10 text-green-500 font-mono text-[10px] gap-1 px-2 py-0.5"
      >
        <CheckCircle2 className="h-3 w-3" />
        <span>PAID</span>
      </Badge>
    );
  }
  if (status === "OVERDUE") {
    return (
      <Badge
        variant="outline"
        className="border-destructive/30 bg-destructive/10 text-destructive font-mono text-[10px] gap-1 px-2 py-0.5"
      >
        <AlertTriangle className="h-3 w-3" />
        <span>OVERDUE</span>
      </Badge>
    );
  }
  if (status === "CANCELLED") {
    return (
      <Badge
        variant="outline"
        className="border-border bg-muted/40 text-muted-foreground font-mono text-[10px] gap-1 px-2 py-0.5"
      >
        <XCircle className="h-3 w-3" />
        <span>CANCELLED</span>
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-amber-500/30 bg-amber-500/10 text-amber-500 font-mono text-[10px] gap-1 px-2 py-0.5"
    >
      <Clock className="h-3 w-3" />
      <span>{status}</span>
    </Badge>
  );
}

const columnHelper = createColumnHelper<TenantInvoice>();

interface BillingInvoicesTableProps {
  invoices: TenantInvoice[];
  picEmail?: string;
}

export function BillingInvoicesTable({
  invoices,
  picEmail,
}: BillingInvoicesTableProps) {
  const { t } = useTranslation();
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const handleDownloadPdf = React.useCallback(
    (inv: TenantInvoice) => {
      toast.success(t("billing.toast_download_invoice", { number: inv.invoiceNumber }), {
        description: t("billing.toast_pdf_gateway_desc"),
      });
    },
    [t]
  );

  const handleCopy = React.useCallback(
    (text: string, label: string) => {
      navigator.clipboard.writeText(text);
      toast.success(t("organizations.copied_to_clipboard", { label }));
    },
    [t]
  );

  const handleResendReceipt = React.useCallback(
    (inv: TenantInvoice) => {
      const recipient = picEmail || t("billing.default_pic_org");
      toast.success(t("billing.toast_resend_receipt", { number: inv.invoiceNumber, recipient }));
    },
    [picEmail, t]
  );

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("invoiceNumber", {
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors font-medium cursor-pointer pl-4"
          >
            <span>{t("billing.invoice_number")}</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3 text-primary" />
            ) : (
              <ArrowUpDown className="size-3 opacity-40 hover:opacity-100" />
            )}
          </button>
        ),
        cell: (info) => (
          <div className="flex items-center gap-2 font-mono font-bold text-foreground pl-4">
            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>{info.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor("date", {
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors font-medium cursor-pointer"
          >
            <span>{t("billing.invoice_date")}</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3 text-primary" />
            ) : (
              <ArrowUpDown className="size-3 opacity-40 hover:opacity-100" />
            )}
          </button>
        ),
        cell: (info) => (
          <span className="font-mono text-xs text-muted-foreground">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("amount", {
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors font-medium cursor-pointer"
          >
            <span>{t("billing.invoice_amount")}</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3 text-primary" />
            ) : (
              <ArrowUpDown className="size-3 opacity-40 hover:opacity-100" />
            )}
          </button>
        ),
        cell: (info) => (
          <span className="font-mono font-semibold text-xs text-foreground">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: t("billing.invoice_status"),
        cell: (info) => <InvoiceStatusBadge status={info.getValue()} />,
      }),
      columnHelper.display({
        id: "actions",
        header: () => (
          <span className="text-right block w-full pr-4">
            {t("billing.invoice_action")}
          </span>
        ),
        cell: (info) => {
          const inv = info.row.original;
          return (
            <div className="text-right pr-4">
              <ActionTooltip label={t("billing.tooltip_download_receipt", { number: inv.invoiceNumber })}>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadPdf(inv);
                  }}
                  className="h-6 text-[11px] border-border bg-card hover:bg-accent text-foreground gap-1 px-2 font-mono font-medium cursor-pointer"
                >
                  <Download className="h-3 w-3" />
                  <span>PDF</span>
                </Button>
              </ActionTooltip>
            </div>
          );
        },
      }),
    ],
    [handleDownloadPdf, t]
  );

  const table = useReactTable({
    data: invoices,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

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
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="py-8 text-center text-xs text-muted-foreground font-mono"
                    >
                      {t("billing.empty_invoices")}
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    const inv = row.original;
                    return (
                      <ContextMenu key={row.id}>
                        <ContextMenuTrigger asChild>
                          <TableRow className="border-b border-border/50 text-xs hover:bg-muted/30 transition-colors cursor-pointer">
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} className="py-2.5 px-3">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
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
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
