import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@k2net/ui";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type TenantDocument, type DocumentStatus, formatFileSize } from "./types";
import type { EnrichedOrganization } from "../../types";
import { getDocumentTemplate, generateDownloadableHtml } from "./document-templates";
import { DocumentLetterheadContent } from "./DocumentLetterheadContent";
import { DocumentAuditHeader } from "./DocumentAuditHeader";

interface DocumentPreviewModalProps {
  previewDoc: TenantDocument | null;
  org: EnrichedOrganization;
  onClose: () => void;
  onDownload: (doc: TenantDocument) => void;
  onUpdateStatus?: (docId: string, status: DocumentStatus, notes?: string) => void;
}

export function DocumentPreviewModal({
  previewDoc,
  org,
  onClose,
  onDownload,
  onUpdateStatus,
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
      <DialogContent className="sm:max-w-4xl bg-popover/95 backdrop-blur-2xl border-border text-foreground rounded-2xl shadow-lg p-6 max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase font-bold">
              <FileText className="h-4 w-4" />
              <span>{tpl.categoryLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-[10px] font-medium",
                  previewDoc.status === "VERIFIED" && "border-primary/40 text-primary bg-primary/10",
                  previewDoc.status === "ACTIVE" && "border-blue-500/40 text-blue-500 bg-blue-500/10",
                  previewDoc.status === "PENDING_REVIEW" && "border-amber-500/40 text-amber-500 bg-amber-500/10",
                  previewDoc.status === "REVISION_REQUIRED" && "border-destructive/40 text-destructive bg-destructive/10"
                )}
              >
                {previewDoc.status}
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

          <DocumentAuditHeader previewDoc={previewDoc} onUpdateStatus={onUpdateStatus} />
        </DialogHeader>

        {/* Scrollable Formal Document Viewport */}
        <DocumentLetterheadContent tpl={tpl} />

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
