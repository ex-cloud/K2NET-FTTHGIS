import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@k2net/ui";
import { FileText, Download, Printer, ShieldCheck, Calendar, Building2 } from "lucide-react";
import { type TenantDocument, formatFileSize } from "./types";
import type { EnrichedOrganization } from "../../types";
import { getDocumentTemplate, generateDownloadableHtml } from "./document-templates";

interface DocumentPreviewModalProps {
  previewDoc: TenantDocument | null;
  org: EnrichedOrganization;
  onClose: () => void;
  onDownload: (doc: TenantDocument) => void;
}

export function DocumentPreviewModal({
  previewDoc,
  org,
  onClose,
  onDownload,
}: DocumentPreviewModalProps) {
  if (!previewDoc) return null;

  const tpl = getDocumentTemplate(previewDoc, org);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(generateDownloadableHtml(previewDoc, org));
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  return (
    <Dialog open={!!previewDoc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl bg-popover/95 backdrop-blur-2xl border-border text-foreground rounded-2xl shadow-2xl p-6 max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase font-bold">
              <FileText className="h-4 w-4" />
              <span>{tpl.categoryLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[10px] font-mono font-bold">
                {tpl.classification}
              </Badge>
              <Badge variant="outline" className="border-border text-[10px] font-mono">
                {previewDoc.format}
              </Badge>
            </div>
          </div>
          <DialogTitle className="text-base font-bold text-foreground truncate mt-1">
            {tpl.title}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-muted-foreground mt-1">
            <span className="flex items-center gap-1 text-foreground/80">
              <Building2 className="h-3 w-3 text-primary" /> {org.name} ({org.slug})
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {tpl.date}
            </span>
            <span>•</span>
            <span className="text-primary font-semibold">No: {tpl.docNumber}</span>
          </div>
        </DialogHeader>

        {/* Scrollable Formal Document Viewport */}
        <div className="flex-1 my-3 overflow-y-auto max-h-[58vh] pr-2 space-y-6 rounded-xl border border-border bg-card/60 p-6 text-foreground font-sans select-text">
          {/* Document Header Letterhead */}
          <div className="flex items-start justify-between border-b border-border/80 pb-4">
            <div>
              <h3 className="text-base font-black tracking-wide text-primary">
                K2NET FTTH GIS ENTERPRISE
              </h3>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Next-Gen Fiber Network GIS Automation &amp; Multi-Tenant Platform
              </p>
            </div>
            <div className="text-right font-mono text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1 justify-end text-primary font-bold">
                <ShieldCheck className="h-3.5 w-3.5" /> SECURE SSE-S3
              </div>
              <div>Hash: SHA-256 Verified</div>
            </div>
          </div>

          {/* Document Body Sections */}
          <div className="space-y-5">
            {tpl.sections.map((sec, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className="text-xs font-bold font-mono tracking-tight text-primary uppercase border-l-2 border-primary pl-2.5">
                  {sec.heading}
                </h4>
                <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-line pl-3">
                  {sec.content}
                </p>

                {sec.bullets && (
                  <ul className="list-disc pl-8 space-y-1 text-xs text-foreground/85">
                    {sec.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="leading-relaxed">
                        {b}
                      </li>
                    ))}
                  </ul>
                )}

                {sec.table && (
                  <div className="overflow-x-auto my-2 pl-3">
                    <table className="w-full border-collapse border border-border text-[11px] font-mono">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border">
                          {sec.table.headers.map((h, hIdx) => (
                            <th
                              key={hIdx}
                              className="border border-border px-3 py-1.5 text-left font-bold text-foreground"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sec.table.rows.map((r, rIdx) => (
                          <tr key={rIdx} className="hover:bg-muted/20">
                            {r.map((c, cIdx) => (
                              <td
                                key={cIdx}
                                className="border border-border px-3 py-1.5 text-muted-foreground"
                              >
                                {c}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Signatories Section */}
          {tpl.signatories && tpl.signatories.length > 0 && (
            <div className="pt-6 border-t border-dashed border-border mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {tpl.signatories.map((sig, sIdx) => (
                  <div key={sIdx} className="space-y-8 bg-card/40 border border-border/60 rounded-lg p-4">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-muted-foreground">
                        {sig.role}
                      </div>
                      <div className="text-xs font-semibold text-foreground/90">{sig.entity}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="w-32 border-b border-border pt-6" />
                      <div className="text-xs font-bold text-primary">{sig.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        Tgl: {sig.signatureDate} (Digital Signed)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Footnote */}
          <div className="pt-4 border-t border-border text-center text-[10px] font-mono text-muted-foreground">
            Dokumen ini diarsipkan secara otomatis di MinIO Object Storage (<code className="text-primary">tenant-assets/documents/</code>) dan dilindungi enkripsi AES-256.
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-border flex flex-row items-center justify-between sm:justify-between w-full">
          <div className="text-[11px] font-mono text-muted-foreground hidden sm:block">
            Ukuran: <span className="text-foreground">{formatFileSize(previewDoc.sizeBytes)}</span> • Status: <span className="text-primary font-semibold">{previewDoc.status}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs border-border gap-1.5 cursor-pointer hover:text-primary"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak / PDF</span>
            </Button>
            <Button
              size="sm"
              onClick={() => onDownload(previewDoc)}
              className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh Berkas</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs cursor-pointer"
            >
              Tutup
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

