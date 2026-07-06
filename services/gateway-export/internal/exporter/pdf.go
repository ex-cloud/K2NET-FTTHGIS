package exporter

import (
	"bytes"
	"fmt"
	"time"

	"github.com/go-pdf/fpdf"
)

// GenerateInvoicePDF renders an InvoiceData to a PDF and returns raw bytes
func GenerateInvoicePDF(data *InvoiceData) ([]byte, error) {
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(15, 20, 15)
	pdf.AddPage()

	// ── Header ──────────────────────────────────────────────
	pdf.SetFont("Arial", "B", 18)
	pdf.SetTextColor(30, 80, 160)
	pdf.CellFormat(0, 10, data.TenantName, "", 1, "L", false, 0, "")

	pdf.SetFont("Arial", "", 9)
	pdf.SetTextColor(80, 80, 80)
	pdf.MultiCell(0, 5, data.TenantAddr, "", "L", false)
	pdf.Ln(3)

	// Invoice Title
	pdf.SetFont("Arial", "B", 14)
	pdf.SetTextColor(0, 0, 0)
	pdf.CellFormat(0, 8, "INVOICE", "", 1, "R", false, 0, "")

	pdf.SetFont("Arial", "", 9)
	pdf.CellFormat(0, 5, fmt.Sprintf("No: %s", data.InvoiceNumber), "", 1, "R", false, 0, "")
	pdf.CellFormat(0, 5, fmt.Sprintf("Tanggal: %s", data.InvoiceDate.Format("02 Jan 2006")), "", 1, "R", false, 0, "")
	pdf.CellFormat(0, 5, fmt.Sprintf("Jatuh Tempo: %s", data.DueDate.Format("02 Jan 2006")), "", 1, "R", false, 0, "")
	pdf.Ln(5)

	// ── Bill To ──────────────────────────────────────────────
	pdf.SetFont("Arial", "B", 10)
	pdf.SetTextColor(30, 80, 160)
	pdf.CellFormat(0, 6, "Tagihan Kepada:", "", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "B", 11)
	pdf.SetTextColor(0, 0, 0)
	pdf.CellFormat(0, 6, data.CustomerName, "", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 9)
	pdf.MultiCell(0, 5, data.CustomerAddr, "", "L", false)
	if data.CustomerPhone != "" {
		pdf.CellFormat(0, 5, fmt.Sprintf("Telp: %s", data.CustomerPhone), "", 1, "L", false, 0, "")
	}
	pdf.Ln(6)

	// ── Items Table Header ─────────────────────────────────────
	pdf.SetFillColor(30, 80, 160)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 9)
	pdf.CellFormat(90, 7, "Deskripsi", "1", 0, "L", true, 0, "")
	pdf.CellFormat(20, 7, "Qty", "1", 0, "C", true, 0, "")
	pdf.CellFormat(35, 7, "Harga Satuan", "1", 0, "R", true, 0, "")
	pdf.CellFormat(35, 7, "Total", "1", 1, "R", true, 0, "")

	// ── Items Table Rows ──────────────────────────────────────
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Arial", "", 9)
	fill := false
	for _, item := range data.Items {
		if fill {
			pdf.SetFillColor(235, 241, 252)
		} else {
			pdf.SetFillColor(255, 255, 255)
		}
		pdf.CellFormat(90, 6, item.Description, "1", 0, "L", true, 0, "")
		pdf.CellFormat(20, 6, fmt.Sprintf("%d", item.Qty), "1", 0, "C", true, 0, "")
		pdf.CellFormat(35, 6, formatRupiah(item.UnitPrice), "1", 0, "R", true, 0, "")
		pdf.CellFormat(35, 6, formatRupiah(item.Total), "1", 1, "R", true, 0, "")
		fill = !fill
	}
	pdf.Ln(3)

	// ── Totals ────────────────────────────────────────────────
	pdf.SetFont("Arial", "", 9)
	pdf.CellFormat(145, 6, "Subtotal", "0", 0, "R", false, 0, "")
	pdf.CellFormat(35, 6, formatRupiah(data.Subtotal), "0", 1, "R", false, 0, "")

	pdf.CellFormat(145, 6, "PPN (11%)", "0", 0, "R", false, 0, "")
	pdf.CellFormat(35, 6, formatRupiah(data.Tax), "0", 1, "R", false, 0, "")

	pdf.SetFont("Arial", "B", 10)
	pdf.SetFillColor(30, 80, 160)
	pdf.SetTextColor(255, 255, 255)
	pdf.CellFormat(145, 8, "TOTAL", "1", 0, "R", true, 0, "")
	pdf.CellFormat(35, 8, formatRupiah(data.Total), "1", 1, "R", true, 0, "")

	pdf.Ln(8)

	// ── Payment Info ──────────────────────────────────────────
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(0, 6, "Informasi Pembayaran", "", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 9)
	pdf.CellFormat(0, 5, fmt.Sprintf("Bank: %s", data.BankName), "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 5, fmt.Sprintf("No. Rekening: %s", data.AccountNumber), "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 5, fmt.Sprintf("Atas Nama: %s", data.AccountName), "", 1, "L", false, 0, "")

	// ── Footer ────────────────────────────────────────────────
	pdf.SetY(-20)
	pdf.SetFont("Arial", "I", 8)
	pdf.SetTextColor(120, 120, 120)
	pdf.CellFormat(0, 5, fmt.Sprintf("Digenerate otomatis oleh sistem K2NET FTTH pada %s", time.Now().Format("02 Jan 2006 15:04")), "", 0, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("failed to render PDF: %w", err)
	}
	return buf.Bytes(), nil
}

func formatRupiah(amount float64) string {
	val := int(amount)
	strVal := fmt.Sprintf("%d", val)
	n := len(strVal)
	if n <= 3 {
		return "Rp " + strVal
	}
	var buf []byte
	for i := 0; i < n; i++ {
		if i > 0 && (n-i)%3 == 0 {
			buf = append(buf, '.')
		}
		buf = append(buf, strVal[i])
	}
	return "Rp " + string(buf)
}
