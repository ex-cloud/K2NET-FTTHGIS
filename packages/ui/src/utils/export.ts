import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn<T> {
  header: string;
  accessorKey: keyof T | ((row: T) => string | number | boolean | null | undefined);
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string = "export"
): void {
  const formattedData = data.map((row) => {
    const rowObj: Record<string, string | number | boolean | null | undefined> = {};
    columns.forEach((col) => {
      const val =
        typeof col.accessorKey === "function"
          ? col.accessorKey(row)
          : row[col.accessorKey as string];
      rowObj[col.header] = val as string | number | boolean | null | undefined;
    });
    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPdf<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  title: string = "Export Report",
  filename: string = "export"
): void {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 15);

  const headers = columns.map((c) => c.header);
  const rows = data.map((row) =>
    columns.map((col) => {
      const val =
        typeof col.accessorKey === "function"
          ? col.accessorKey(row)
          : row[col.accessorKey as string];
      return String(val ?? "");
    })
  );

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 22,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] },
  });

  doc.save(`${filename}.pdf`);
}
