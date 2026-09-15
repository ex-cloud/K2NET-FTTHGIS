import type { EnrichedOrganization } from "../../../types";
import type { DocumentTemplateContent } from "./types";

const DOCUMENT_HTML_STYLES = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    margin: 40px auto;
    max-width: 800px;
    line-height: 1.6;
    color: #1a202c;
    background: #ffffff;
    padding: 0 20px;
  }
  .header {
    border-bottom: 3px double #2d3748;
    padding-bottom: 16px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .brand-title {
    font-size: 20px;
    font-weight: 800;
    color: #059669;
    letter-spacing: 0.5px;
  }
  .brand-sub {
    font-size: 11px;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .badge {
    display: inline-block;
    padding: 4px 10px;
    font-size: 10px;
    font-weight: 700;
    font-family: monospace;
    border-radius: 4px;
    background: #ecfdf5;
    color: #059669;
    border: 1px solid #a7f3d0;
  }
  h1 {
    font-size: 16px;
    font-weight: 800;
    text-align: center;
    margin: 24px 0 6px 0;
    color: #111827;
    line-height: 1.4;
  }
  .doc-meta {
    text-align: center;
    font-size: 11px;
    font-family: monospace;
    color: #6b7280;
    margin-bottom: 32px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 12px;
  }
  .section {
    margin-bottom: 24px;
  }
  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: #1f2937;
    text-transform: uppercase;
    border-left: 3px solid #059669;
    padding-left: 8px;
    margin-bottom: 8px;
  }
  .section-content {
    font-size: 12px;
    color: #374151;
    white-space: pre-line;
  }
  ul {
    margin: 8px 0;
    padding-left: 20px;
    font-size: 12px;
    color: #374151;
  }
  li {
    margin-bottom: 4px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 11px;
  }
  th, td {
    border: 1px solid #d1d5db;
    padding: 8px 10px;
    text-align: left;
  }
  th {
    background: #f9fafb;
    font-weight: 700;
    color: #111827;
  }
  .signatures {
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px dashed #cbd5e1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }
  .sig-block {
    font-size: 11px;
  }
  .sig-role {
    font-weight: 700;
    color: #4b5563;
    margin-bottom: 50px;
  }
  .sig-name {
    font-weight: 800;
    color: #111827;
    text-decoration: underline;
  }
  .sig-entity {
    color: #6b7280;
  }
  .footer {
    margin-top: 40px;
    border-top: 1px solid #e5e7eb;
    padding-top: 12px;
    font-size: 10px;
    color: #9ca3af;
    text-align: center;
    font-family: monospace;
  }
  @media print {
    body { margin: 0; padding: 15mm; }
    .no-print { display: none; }
  }
`;

export function generateHtmlFromTemplate(
  tpl: DocumentTemplateContent,
  org: EnrichedOrganization
): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${tpl.title} - ${org.name}</title>
  <style>${DOCUMENT_HTML_STYLES}</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">K2NET FTTH GIS ENTERPRISE</div>
      <div class="brand-sub">Platform Otomasi Telekomunikasi &amp; Jaringan Fiber Optik</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">${tpl.classification}</span>
      <div style="font-size: 10px; color: #6b7280; margin-top: 4px; font-family: monospace;">Tgl: ${tpl.date}</div>
    </div>
  </div>

  <h1>${tpl.title}</h1>
  <div class="doc-meta">
    No. Berkas: ${tpl.docNumber} &nbsp;•&nbsp; Tenant: ${org.name} (${org.slug})
    ${tpl.effectivePeriod ? `<br>Masa Berlaku: ${tpl.effectivePeriod}` : ""}
  </div>

  ${tpl.sections
    .map(
      (sec) => `
    <div class="section">
      <div class="section-title">${sec.heading}</div>
      <div class="section-content">${sec.content}</div>
      ${sec.bullets ? `<ul>${sec.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>` : ""}
      ${
        sec.table
          ? `<table>
          <thead>
            <tr>${sec.table.headers.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${sec.table.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>`
          : ""
      }
    </div>
  `
    )
    .join("")}

  ${
    tpl.signatories && tpl.signatories.length > 0
      ? `
    <div class="signatures">
      ${tpl.signatories
        .map(
          (sig) => `
        <div class="sig-block">
          <div class="sig-role">${sig.role}</div>
          <div class="sig-name">${sig.name}</div>
          <div class="sig-entity">${sig.entity}</div>
          <div style="color: #9ca3af; margin-top: 2px;">Tanggal: ${sig.signatureDate}</div>
        </div>
      `
        )
        .join("")}
    </div>
  `
      : ""
  }

  <div class="footer">
    Dokumen ini digenerate secara resmi melalui Sistem Vault Legalitas K2NET FTTH GIS Enterprise SaaS.<br>
    Integritas berkas terenkripsi dan tercatat dalam log audit platform (SHA-256 Verified).
  </div>
</body>
</html>`;
}
