import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { BillingInvoiceItem } from "../hooks/useTenantLicense";

export interface GenerateInvoicePdfOptions {
  tenantSlug?: string;
  currency?: string;
}

function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateStr(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function generateInvoicePdf(
  invoice: BillingInvoiceItem,
  options?: GenerateInvoicePdfOptions
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const leftMargin = 14;
  const rightMargin = pageWidth - 14;

  // 1. Header: Platform Identity
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("K2NET ENTERPRISE CLOUD", leftMargin, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text("PT KIRANA KARINA NETWORKS — FTTH GIS SaaS Platform", leftMargin, 23);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("NPWP: 01.234.567.8-901.000 | Graha K2NET, Bandung - Indonesia", leftMargin, 27);
  doc.text("Email: support@kdua.net | Web: https://system-gis.kdua.net", leftMargin, 31);

  // Document Title & Number (Right aligned)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("FAKTUR TAGIHAN RESMI", rightMargin, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`No: ${invoice.invoiceNumber}`, rightMargin, 23, { align: "right" });

  const statusLabel =
    invoice.status === "PAID"
      ? "STATUS: LUNAS / PAID"
      : invoice.status === "PENDING"
        ? "STATUS: MENUNGGU PEMBAYARAN"
        : `STATUS: ${invoice.status}`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  if (invoice.status === "PAID") {
    doc.setTextColor(16, 185, 129); // emerald-500
  } else {
    doc.setTextColor(217, 119, 6); // amber-600
  }
  doc.text(statusLabel, rightMargin, 28, { align: "right" });

  // Divider Line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(leftMargin, 34, rightMargin, 34);

  // 2. Metadata Columns (Billed To vs Invoice Details)
  // Left: Customer info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("TAGIHAN KEPADA / BILLED TO:", leftMargin, 42);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.organizationName || "Organisasi Pelanggan", leftMargin, 47);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Tenant ID: @${options?.tenantSlug || "tenant"}`, leftMargin, 52);
  doc.text("Layanan: K2NET FTTH Geospatial Network Management", leftMargin, 56);

  // Right: Dates info
  const rightColX = 125;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("DETAIL TRANSAKSI / INVOICE INFO:", rightColX, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Tanggal Terbit: ${formatDateStr(invoice.createdAt)}`, rightColX, 47);
  doc.text(`Jatuh Tempo: ${formatDateStr(invoice.dueDate)}`, rightColX, 52);
  if (invoice.paidAt) {
    doc.text(`Tanggal Lunas: ${formatDateStr(invoice.paidAt)}`, rightColX, 56);
  } else {
    doc.text("Tanggal Lunas: — (Belum Lunas)", rightColX, 56);
  }

  // 3. Calculation: DPP (Dasar Pengenaan Pajak) & PPN 11%
  const totalAmount = invoice.amount || 0;
  const dpp = Math.round(totalAmount / 1.11);
  const ppn = totalAmount - dpp;

  // 4. Line Items Table (autoTable)
  autoTable(doc, {
    startY: 63,
    margin: { left: leftMargin, right: 14 },
    head: [["No", "Deskripsi Layanan / Item", "Kuantitas", "Harga Satuan (IDR)", "Subtotal (IDR)"]],
    body: [
      [
        "1",
        invoice.description || "Langganan FTTH GIS Enterprise SaaS Platform",
        "1 Bulan",
        formatIdr(dpp),
        formatIdr(dpp),
      ],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 90 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
  });

  // Get Y position after table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 100;

  // 5. Payment Info Box (Left) & Financial Summary (Right)
  // Left Box: Payment Details
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(leftMargin, finalY, 85, 32, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("METODE & REKONSILIASI PEMBAYARAN", leftMargin + 4, finalY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Metode: ${invoice.paymentMethod || "Virtual Account / QRIS"}`, leftMargin + 4, finalY + 12);
  doc.text(`Saluran: ${invoice.paymentChannel || "Xendit Payment Gateway"}`, leftMargin + 4, finalY + 17);
  doc.text(`ID Referensi: ${invoice.externalReferenceId || invoice.id.slice(0, 18)}`, leftMargin + 4, finalY + 22);
  doc.text("Mata Uang: IDR (Rupiah Indonesia)", leftMargin + 4, finalY + 27);

  // Right Block: Financial Calculation
  const summaryXLabel = 120;
  const summaryXValue = rightMargin;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Subtotal (DPP):", summaryXLabel, finalY + 6);
  doc.text(formatIdr(dpp), summaryXValue, finalY + 6, { align: "right" });

  doc.text("PPN (Pajak Pertambahan Nilai 11%):", summaryXLabel, finalY + 13);
  doc.text(formatIdr(ppn), summaryXValue, finalY + 13, { align: "right" });

  doc.setDrawColor(226, 232, 240);
  doc.line(summaryXLabel, finalY + 17, rightMargin, finalY + 17);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text("TOTAL TAGIHAN BERSIH:", summaryXLabel, finalY + 23);
  doc.text(formatIdr(totalAmount), summaryXValue, finalY + 23, { align: "right" });

  // 6. Paid Stamp (Watermark) if status is PAID
  if (invoice.status === "PAID") {
    const stampX = rightMargin - 45;
    const stampY = finalY + 36;

    doc.setDrawColor(16, 185, 129); // emerald-500
    doc.setLineWidth(1);
    doc.roundedRect(stampX, stampY, 45, 16, 2, 2, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.text("LUNAS / PAID", stampX + 22.5, stampY + 7.5, { align: "center" });

    doc.setFontSize(7);
    doc.text(formatDateStr(invoice.paidAt || invoice.createdAt), stampX + 22.5, stampY + 12.5, {
      align: "center",
    });
  }

  // 7. Legal Disclaimer & Footer
  const footerY = 270;
  doc.setDrawColor(226, 232, 240);
  doc.line(leftMargin, footerY, rightMargin, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Dokumen ini merupakan faktur elektronik resmi yang diterbitkan oleh K2NET Enterprise Cloud dan sah tanpa tanda tangan basah.",
    pageWidth / 2,
    footerY + 5,
    { align: "center" }
  );
  doc.text(
    "Keabsahan faktur dapat diverifikasi secara daring di https://system-gis.kdua.net/billing/invoices",
    pageWidth / 2,
    footerY + 9,
    { align: "center" }
  );

  // 8. Save/Download File
  doc.save(`INVOICE-${invoice.invoiceNumber}.pdf`);
}
