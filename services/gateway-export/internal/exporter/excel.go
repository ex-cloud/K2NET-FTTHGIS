package exporter

import (
	"bytes"
	"fmt"
	"time"

	"github.com/xuri/excelize/v2"
)

// GenerateBillingExcel generates a billing report Excel file for a given period
func GenerateBillingExcel(tenantSlug, period string, rows []BillingRow) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	sheet := "Billing Report"
	f.SetSheetName("Sheet1", sheet)

	// ── Style Definitions ──────────────────────────────────────
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF", Size: 10},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"1E50A0"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "FFFFFF", Style: 1},
			{Type: "right", Color: "FFFFFF", Style: 1},
		},
	})

	totalStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 10},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"EBF1FC"}, Pattern: 1},
		NumFmt:    3, // thousands separator
	})

	currencyStyle, _ := f.NewStyle(&excelize.Style{
		NumFmt: 3, // #,##0 format
	})

	altStyle, _ := f.NewStyle(&excelize.Style{
		Fill:   excelize.Fill{Type: "pattern", Color: []string{"F5F8FE"}, Pattern: 1},
		NumFmt: 3,
	})

	// ── Title ──────────────────────────────────────────────────
	f.MergeCell(sheet, "A1", "H1")
	f.SetCellValue(sheet, "A1", fmt.Sprintf("LAPORAN BILLING — %s — Periode: %s", tenantSlug, period))
	titleStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 14, Color: "1E50A0"},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})
	f.SetCellStyle(sheet, "A1", "H1", titleStyle)
	f.SetRowHeight(sheet, 1, 28)

	f.SetCellValue(sheet, "A2", fmt.Sprintf("Digenerate: %s", time.Now().Format("02 Jan 2006 15:04")))
	f.SetRowHeight(sheet, 2, 16)

	// ── Headers ────────────────────────────────────────────────
	headers := []string{"No", "Nama Pelanggan", "No Invoice", "Paket", "Tagihan (Rp)", "Status", "Tgl Bayar", "Keterangan"}
	cols := []string{"A", "B", "C", "D", "E", "F", "G", "H"}
	widths := []float64{5, 28, 20, 18, 16, 12, 15, 20}

	for i, h := range headers {
		cell := cols[i] + "4"
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, headerStyle)
		f.SetColWidth(sheet, cols[i], cols[i], widths[i])
	}
	f.SetRowHeight(sheet, 4, 20)

	// ── Data Rows ──────────────────────────────────────────────
	for i, row := range rows {
		r := i + 5
		useAlt := i%2 == 1

		f.SetCellValue(sheet, fmt.Sprintf("A%d", r), i+1)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", r), row.CustomerName)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", r), row.InvoiceNumber)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", r), row.PackageName)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", r), row.Amount)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", r), row.Status)
		if row.PaidAt != nil {
			f.SetCellValue(sheet, fmt.Sprintf("G%d", r), row.PaidAt.Format("02/01/2006"))
		}
		f.SetCellValue(sheet, fmt.Sprintf("H%d", r), row.Notes)

		if useAlt {
			f.SetCellStyle(sheet, fmt.Sprintf("A%d", r), fmt.Sprintf("H%d", r), altStyle)
		}
		f.SetCellStyle(sheet, fmt.Sprintf("E%d", r), fmt.Sprintf("E%d", r), currencyStyle)
		f.SetRowHeight(sheet, r, 16)
	}

	// ── Total Row ──────────────────────────────────────────────
	totalRow := len(rows) + 5
	var grandTotal float64
	for _, row := range rows {
		grandTotal += row.Amount
	}
	f.SetCellValue(sheet, fmt.Sprintf("D%d", totalRow), "TOTAL")
	f.SetCellValue(sheet, fmt.Sprintf("E%d", totalRow), grandTotal)
	f.SetCellStyle(sheet, fmt.Sprintf("A%d", totalRow), fmt.Sprintf("H%d", totalRow), totalStyle)

	// ── Freeze top 4 rows ─────────────────────────────────────
	f.SetPanes(sheet, &excelize.Panes{Freeze: true, YSplit: 4, TopLeftCell: "A5", ActivePane: "bottomLeft"})

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, fmt.Errorf("failed to write excel: %w", err)
	}
	return buf.Bytes(), nil
}

// BillingRow is a single row in the billing report
type BillingRow struct {
	CustomerName  string
	InvoiceNumber string
	PackageName   string
	Amount        float64
	Status        string
	PaidAt        *time.Time
	Notes         string
}

// GenerateGenericExcel creates a generic tabular report for network/inventory/tickets/customer data
func GenerateGenericExcel(title, sheet string, headers []string, data [][]any) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	f.SetSheetName("Sheet1", sheet)

	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "FFFFFF", Size: 10},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"1E50A0"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})

	// Title
	endCol, _ := excelize.ColumnNumberToName(len(headers))
	f.MergeCell(sheet, "A1", endCol+"1")
	titleStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 13, Color: "1E50A0"},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})
	f.SetCellValue(sheet, "A1", title)
	f.SetCellStyle(sheet, "A1", endCol+"1", titleStyle)
	f.SetRowHeight(sheet, 1, 24)

	// Headers row 3
	for i, h := range headers {
		col, _ := excelize.ColumnNumberToName(i + 1)
		cell := col + "3"
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, headerStyle)
		f.SetColWidth(sheet, col, col, 18)
	}
	f.SetRowHeight(sheet, 3, 20)

	// Data rows
	altStyle, _ := f.NewStyle(&excelize.Style{
		Fill: excelize.Fill{Type: "pattern", Color: []string{"F5F8FE"}, Pattern: 1},
	})

	for ri, row := range data {
		r := ri + 4
		for ci, val := range row {
			col, _ := excelize.ColumnNumberToName(ci + 1)
			f.SetCellValue(sheet, fmt.Sprintf("%s%d", col, r), val)
		}
		if ri%2 == 1 {
			endC, _ := excelize.ColumnNumberToName(len(headers))
			f.SetCellStyle(sheet, fmt.Sprintf("A%d", r), fmt.Sprintf("%s%d", endC, r), altStyle)
		}
		f.SetRowHeight(sheet, r, 15)
	}

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, fmt.Errorf("failed to write generic excel: %w", err)
	}
	return buf.Bytes(), nil
}
