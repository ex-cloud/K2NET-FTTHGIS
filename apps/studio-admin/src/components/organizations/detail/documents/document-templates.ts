import type { EnrichedOrganization } from "../../types";
import type { TenantDocument } from "./types";
import type { DocumentTemplateContent } from "./templates/types";
import { getMouTemplate } from "./templates/mouTemplate";
import { getBastTemplate } from "./templates/bastTemplate";
import { getLegalTemplate } from "./templates/legalTemplate";
import { getTopologyTemplate } from "./templates/topologyTemplate";
import { getSlaTemplate } from "./templates/slaTemplate";
import { generateHtmlFromTemplate } from "./templates/htmlGenerator";
import { createBinaryPdfBlob } from "./templates/pdfGenerator";

export type { DocumentTemplateContent };
export { createBinaryPdfBlob };

export function getDocumentTemplate(
  doc: TenantDocument,
  org: EnrichedOrganization
): DocumentTemplateContent {
  const orgName = org.name || "PT ISP MITRA NUSANTARA";
  const orgSlug = (org.slug || "tenant").toUpperCase();
  const picName = org.picName || "Direktur Operasional";
  const planName = org.planTier || "Enterprise";
  const lowerName = doc.name.toLowerCase();

  if (lowerName.includes("mou") || lowerName.includes("enterprise-agreement")) {
    return getMouTemplate(org, orgName, orgSlug, picName);
  }

  if (lowerName.includes("bast") || lowerName.includes("serah-terima")) {
    return getBastTemplate(org, orgName, orgSlug, picName);
  }

  if (lowerName.includes("npwp") || lowerName.includes("legalitas") || lowerName.includes("nib")) {
    return getLegalTemplate(org, orgName, orgSlug, picName);
  }

  if (lowerName.includes("topology") || lowerName.includes("bras") || lowerName.includes("kmz")) {
    return getTopologyTemplate(org, orgName, orgSlug);
  }

  return getSlaTemplate(org, orgName, orgSlug, planName);
}

export function generateDownloadableHtml(
  doc: TenantDocument,
  org: EnrichedOrganization
): string {
  const tpl = getDocumentTemplate(doc, org);
  return generateHtmlFromTemplate(tpl, org);
}

export function downloadDocumentFile(
  doc: TenantDocument,
  org: EnrichedOrganization
) {
  const tpl = getDocumentTemplate(doc, org);
  const isPdf = doc.format === "PDF" || doc.name.toLowerCase().endsWith(".pdf");

  let blob: Blob;
  let filename = doc.name;

  if (isPdf) {
    blob = createBinaryPdfBlob(tpl, org);
    if (!filename.toLowerCase().endsWith(".pdf")) {
      filename += ".pdf";
    }
  } else {
    const htmlContent = generateDownloadableHtml(doc, org);
    blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    if (!filename.toLowerCase().endsWith(".html") && !filename.toLowerCase().endsWith(".kmz")) {
      filename = filename.replace(/\.[^/.]+$/, "") + ".html";
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
