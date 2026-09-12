import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@k2net/ui";
import { FileText, FileCheck, Download } from "lucide-react";
import { type TenantDocument, formatFileSize } from "./types";

interface DocumentPreviewModalProps {
  previewDoc: TenantDocument | null;
  onClose: () => void;
  onDownload: (doc: TenantDocument) => void;
}

export function DocumentPreviewModal({
  previewDoc,
  onClose,
  onDownload,
}: DocumentPreviewModalProps) {
  return (
    <Dialog open={!!previewDoc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-popover/95 backdrop-blur-2xl border-border text-foreground rounded-2xl shadow-2xl p-6 max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase font-bold">
              <FileText className="h-4 w-4" />
              <span>Dokumen Preview</span>
            </div>
            <Badge variant="outline" className="border-border text-[10px] font-mono">
              {previewDoc?.format}
            </Badge>
          </div>
          <DialogTitle className="text-base font-bold text-foreground truncate">
            {previewDoc?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 my-3 p-8 border border-border rounded-xl bg-card/60 flex flex-col items-center justify-center gap-3 text-center min-h-[260px]">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <FileCheck className="h-7 w-7" />
          </div>
          <div className="space-y-1 max-w-sm">
            <span className="text-sm font-bold text-foreground block">
              {previewDoc?.name}
            </span>
            <p className="text-xs text-muted-foreground">
              Berkas tersimpan aman di MinIO Object Storage bucket <code className="text-primary font-mono">tenant-assets</code> (Private SSE-S3).
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2 text-xs font-mono text-muted-foreground">
            <span>Ukuran: {previewDoc ? formatFileSize(previewDoc.sizeBytes) : "0 KB"}</span>
            <span>•</span>
            <span>Status: {previewDoc?.status}</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs border-border"
          >
            Tutup
          </Button>
          <Button
            size="sm"
            onClick={() => previewDoc && onDownload(previewDoc)}
            className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unduh Berkas</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
