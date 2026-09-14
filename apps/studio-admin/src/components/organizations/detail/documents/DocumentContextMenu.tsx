import * as React from "react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@k2net/ui";
import {
  Eye,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Copy,
  Trash2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { TenantDocument, DocumentStatus } from "./types";
import type { EnrichedOrganization } from "../../types";
import { generateDownloadableHtml } from "./document-templates";

interface DocumentContextMenuProps {
  document: TenantDocument;
  org: EnrichedOrganization;
  slug: string;
  onPreview: (doc: TenantDocument) => void;
  onDownload: (doc: TenantDocument) => void;
  onDelete: (id: string, name: string) => void;
  onUpdateStatus: (docId: string, status: DocumentStatus, notes?: string) => void;
  children: React.ReactNode;
}

export function DocumentContextMenu({
  document: doc,
  org,
  slug,
  onPreview,
  onDownload,
  onDelete,
  onUpdateStatus,
  children,
}: DocumentContextMenuProps) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(generateDownloadableHtml(doc, org));
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin ke clipboard`);
  };

  const s3Path = `s3://tenant-assets/tenants/${slug}/documents/${doc.category.toLowerCase()}/${doc.name}`;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-popover/95 backdrop-blur-xl border-border/80 shadow-2xl text-xs z-[9999] py-1.5 rounded-xl">
        {/* 1. Preview Document */}
        <ContextMenuItem
          onClick={() => onPreview(doc)}
          className="cursor-pointer font-semibold text-foreground focus:bg-accent gap-2"
        >
          <Eye className="w-3.5 h-3.5 text-primary" />
          <span>Preview Dokumen</span>
          <ContextMenuShortcut>↵</ContextMenuShortcut>
        </ContextMenuItem>

        {/* 2. Download File */}
        <ContextMenuItem
          onClick={() => onDownload(doc)}
          className="cursor-pointer gap-2 focus:bg-accent text-foreground"
        >
          <Download className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Unduh Berkas</span>
          <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
        </ContextMenuItem>

        {/* 3. Print / PDF */}
        <ContextMenuItem
          onClick={handlePrint}
          className="cursor-pointer gap-2 focus:bg-accent text-foreground"
        >
          <Printer className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Cetak / Cetak PDF</span>
          <ContextMenuShortcut>Ctrl+P</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="my-1 bg-border/60" />

        {/* 4. Verification Workflow Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer gap-2 focus:bg-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Status Verifikasi &amp; Validasi</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-56 bg-popover/95 backdrop-blur-xl border-border/80 shadow-2xl text-xs z-[9999] py-1.5 rounded-xl">
            <ContextMenuItem
              onClick={() => onUpdateStatus(doc.id, "VERIFIED")}
              className="cursor-pointer gap-2 focus:bg-primary/10 text-primary font-semibold"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>Setujui (Verify)</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onPreview(doc)}
              className="cursor-pointer gap-2 focus:bg-amber-500/10 text-amber-500"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Minta Revisi...</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus(doc.id, "PENDING_REVIEW")}
              className="cursor-pointer gap-2 focus:bg-muted text-foreground"
            >
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Tandai Menunggu Review</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus(doc.id, "ACTIVE")}
              className="cursor-pointer gap-2 focus:bg-blue-500/10 text-blue-500"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Tandai Aktif (Active)</span>
            </ContextMenuItem>
            <ContextMenuSeparator className="my-1 bg-border/60" />
            <ContextMenuItem
              onClick={() => onUpdateStatus(doc.id, "REJECTED")}
              className="cursor-pointer gap-2 focus:bg-destructive/10 text-destructive"
            >
              <XCircle className="w-3.5 h-3.5 text-destructive" />
              <span>Tolak Dokumen (Reject)</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* 5. Copy Info Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer gap-2 focus:bg-muted">
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Salin Info Dokumen</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-56 bg-popover/95 backdrop-blur-xl border-border/80 shadow-2xl text-xs z-[9999] py-1.5 rounded-xl">
            <ContextMenuItem
              onClick={() => handleCopy(doc.name, "Nama Berkas")}
              className="cursor-pointer gap-2 focus:bg-muted"
            >
              <span>Salin Nama Berkas</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => handleCopy(s3Path, "Alamat S3 Path")}
              className="cursor-pointer gap-2 focus:bg-muted"
            >
              <span>Salin S3 URI Path</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => handleCopy(doc.id, "ID Dokumen")}
              className="cursor-pointer gap-2 focus:bg-muted"
            >
              <span>Salin ID Dokumen ({doc.id})</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => handleCopy(doc.uploadedBy, "PIC Pengunggah")}
              className="cursor-pointer gap-2 focus:bg-muted"
            >
              <span>Salin Pengunggah ({doc.uploadedBy})</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator className="my-1 bg-border/60" />

        {/* 6. Delete Document */}
        <ContextMenuItem
          onClick={() => onDelete(doc.id, doc.name)}
          className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive gap-2 font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Hapus Dokumen dari Vault</span>
          <ContextMenuShortcut className="text-destructive font-mono">Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
