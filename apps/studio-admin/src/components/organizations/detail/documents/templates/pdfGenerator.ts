import type { EnrichedOrganization } from "../../../types";
import type { DocumentTemplateContent } from "./types";

export function createBinaryPdfBlob(tpl: DocumentTemplateContent, org: EnrichedOrganization): Blob {
  let stream = "BT\n";
  stream += "/F1 16 Tf\n50 785 Td\n(K2NET FTTH GIS ENTERPRISE) Tj\n";
  stream += "/F2 9 Tf\n0 -13 Td\n(Platform Otomasi Telekomunikasi & Infrastruktur Fiber Optik) Tj\n";
  stream += "/F1 9 Tf\n330 13 Td\n([" + (tpl.classification || "LEGAL RECORD") + "]) Tj\n";
  stream += "/F2 8 Tf\n0 -11 Td\n(Status: VERIFIED LEGAL RECORD) Tj\n";
  stream += "ET\n";

  // Separator Line
  stream += "0.75 0.75 0.75 RG\n1 w\n50 745 m 545 745 l S\n";

  // Document Header
  stream += "BT\n/F1 12.5 Tf\n0.1 0.1 0.1 rg\n50 720 Td\n(" + tpl.title.replace(/[()]/g, "") + ") Tj\n";
  stream += "/F2 8.5 Tf\n0.35 0.35 0.35 rg\n0 -13 Td\n(No. Dokumen: " + tpl.docNumber + "   |   Tenant: " + org.name + " [" + org.slug + "]) Tj\n";
  if (tpl.effectivePeriod) {
    stream += "/F3 8 Tf\n0 -11 Td\n(Masa Berlaku: " + tpl.effectivePeriod + ") Tj\n";
  }
  stream += "ET\n";

  let currentY = 665;
  for (const sec of tpl.sections) {
    stream += "BT\n/F1 9.5 Tf\n0.15 0.15 0.15 rg\n50 " + currentY + " Td\n(" + sec.heading.replace(/[()]/g, "") + ") Tj\n";
    currentY -= 13;

    stream += "/F2 8.5 Tf\n0.25 0.25 0.25 rg\n50 " + currentY + " Td\n";
    const words = sec.content.replace(/[()]/g, "").split(" ");
    let line = "";
    let lineCount = 0;
    for (const w of words) {
      if ((line + " " + w).length > 95) {
        stream += "(" + line.trim() + ") Tj\n0 -11 Td\n";
        line = w + " ";
        lineCount++;
      } else {
        line += w + " ";
      }
    }
    if (line.trim()) {
      stream += "(" + line.trim() + ") Tj\n";
      lineCount++;
    }
    currentY -= (lineCount * 11 + 5);

    if (sec.bullets) {
      for (const b of sec.bullets) {
        const cleanB = b.replace(/[()]/g, "").replace(/✔/g, "-");
        stream += "0 -11 Td\n(  * " + cleanB + ") Tj\n";
        currentY -= 11;
      }
    }
    currentY -= 8;
    stream += "ET\n";
  }

  // Signatures
  if (tpl.signatories && tpl.signatories.length > 0) {
    currentY -= 10;
    stream += "0.8 0.8 0.8 RG\n1 w\n50 " + (currentY + 15) + " m 545 " + (currentY + 15) + " l S\n";
    stream += "BT\n/F1 8.5 Tf\n50 " + currentY + " Td\n(PIHAK PERTAMA (K2NET):) Tj\n";
    stream += "300 0 Td\n(PIHAK KEDUA (TENANT):) Tj\n";
    currentY -= 35;
    stream += "ET\nBT\n/F1 8.5 Tf\n50 " + currentY + " Td\n(" + (tpl.signatories[0]?.name || "Super Admin") + ") Tj\n";
    stream += "/F2 7.5 Tf\n0 -10 Td\n(" + (tpl.signatories[0]?.role || "Platform Admin") + ") Tj\n";
    stream += "/F1 8.5 Tf\n300 10 Td\n(" + (tpl.signatories[1]?.name || "Direktur Utama") + ") Tj\n";
    stream += "/F2 7.5 Tf\n0 -10 Td\n(" + (tpl.signatories[1]?.role || org.name) + ") Tj\nET\n";
  }

  // Footer
  stream += "BT\n/F3 7 Tf\n0.45 0.45 0.45 rg\n50 30 Td\n(Dokumen resmi K2NET FTTH GIS Enterprise SaaS - Terenkripsi & Tercatat dalam Audit Log SHA-256) Tj\nET\n";

  const streamBytes = new TextEncoder().encode(stream);
  const pdfParts: (string | Uint8Array)[] = [];
  pdfParts.push("%PDF-1.4\n");
  const offsets: number[] = [];

  function getLength(): number {
    return pdfParts.reduce((acc, p) => acc + (typeof p === "string" ? p.length : p.byteLength), 0);
  }

  offsets.push(getLength());
  pdfParts.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  offsets.push(getLength());
  pdfParts.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  offsets.push(getLength());
  pdfParts.push("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>\nendobj\n");

  offsets.push(getLength());
  pdfParts.push("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n");

  offsets.push(getLength());
  pdfParts.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

  offsets.push(getLength());
  pdfParts.push("6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj\n");

  offsets.push(getLength());
  pdfParts.push(`7 0 obj\n<< /Length ${streamBytes.byteLength} >>\nstream\n`);
  pdfParts.push(streamBytes);
  pdfParts.push("\nendstream\nendobj\n");

  const xrefOffset = getLength();
  let xrefStr = "xref\n0 8\n0000000000 65535 f \n";
  for (const o of offsets) {
    xrefStr += String(o).padStart(10, "0") + " 00000 n \n";
  }
  xrefStr += `trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  pdfParts.push(xrefStr);

  return new Blob(pdfParts as BlobPart[], { type: "application/pdf" });
}
