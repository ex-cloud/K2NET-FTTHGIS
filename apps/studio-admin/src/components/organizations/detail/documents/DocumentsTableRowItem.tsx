import {
  Badge,
  Button,
  TableRow,
  TableCell,
  ActionTooltip,
} from "@k2net/ui";
import {
  FileText,
  Download,
  Eye,
  Trash2,
  FileCode,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type TenantDocument, type DocumentStatus, formatFileSize } from "./types";
import type { EnrichedOrganization } from "../../types";
import { DocumentContextMenu } from "./DocumentContextMenu";

interface DocumentsTableRowItemProps {
  doc: TenantDocument;
  org: EnrichedOrganization;
  slug: string;
  onPreview: (doc: TenantDocument) => void;
  onDownload: (doc: TenantDocument) => void;
  onDelete: (id: string, name: string) => void;
  onUpdateStatus: (docId: string, status: DocumentStatus, notes?: string) => void;
}

export function DocumentsTableRowItem({
  doc,
  org,
  slug,
  onPreview,
  onDownload,
  onDelete,
  onUpdateStatus,
}: DocumentsTableRowItemProps) {
  return (
    <DocumentContextMenu
      document={doc}
      org={org}
      slug={slug}
      onPreview={onPreview}
      onDownload={onDownload}
      onDelete={onDelete}
      onUpdateStatus={onUpdateStatus}
    >
      <TableRow
        onDoubleClick={() => onPreview(doc)}
        className="border-border hover:bg-muted/30 transition-colors cursor-context-menu"
      >
        <TableCell className="font-medium text-xs text-foreground">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-muted/60 border border-border flex items-center justify-center text-muted-foreground shrink-0">
              {doc.format === "PDF" ? (
                <FileText className="h-3.5 w-3.5 text-red-500" />
              ) : (
                <FileCode className="h-3.5 w-3.5 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <span className="font-semibold block truncate max-w-xs">{doc.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono truncate block max-w-xs">
                s3://tenant-assets/tenants/{slug}/documents/{doc.category.toLowerCase()}/
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="border-border text-[9px] font-mono">
            {doc.category}
          </Badge>
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground">
          {formatFileSize(doc.sizeBytes)}
        </TableCell>
        <TableCell className="text-xs text-foreground">
          {doc.uploadedBy}
        </TableCell>
        <TableCell className="font-mono text-[11px] text-muted-foreground">
          {doc.uploadedAt}
        </TableCell>
        <TableCell>
          <div className="space-y-0.5">
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-[9px] font-semibold",
                doc.status === "VERIFIED" && "border-primary/40 bg-primary/10 text-primary",
                doc.status === "ACTIVE" && "border-blue-500/40 bg-blue-500/10 text-blue-500",
                doc.status === "PENDING_REVIEW" && "border-amber-500/40 bg-amber-500/10 text-amber-500",
                doc.status === "REVISION_REQUIRED" && "border-destructive/40 bg-destructive/10 text-destructive",
                doc.status === "REJECTED" && "border-destructive/40 bg-destructive/10 text-destructive"
              )}
            >
              {doc.status}
            </Badge>
            {doc.verifiedBy && (
              <div className="text-[9px] font-mono text-muted-foreground truncate max-w-[120px]">
                ✓ {doc.verifiedBy}
              </div>
            )}
            {doc.reviewNotes && (
              <div className="text-[9px] text-destructive truncate max-w-[120px]" title={doc.reviewNotes}>
                ⚠ {doc.reviewNotes}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            {/* Quick Verify Action */}
            {doc.status !== "VERIFIED" && (
              <ActionTooltip label="Setujui Dokumen (Verify)">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onUpdateStatus(doc.id, "VERIFIED")}
                  className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
              </ActionTooltip>
            )}

            {/* Quick Revision Action */}
            {doc.status !== "REVISION_REQUIRED" && doc.status !== "ACTIVE" && (
              <ActionTooltip label="Minta Revisi">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onPreview(doc)}
                  className="h-7 w-7 text-amber-500 hover:text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                </Button>
              </ActionTooltip>
            )}

            <ActionTooltip label="Preview Dokumen">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onPreview(doc)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Download Berkas">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDownload(doc)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Hapus Dokumen">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(doc.id, doc.name)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </ActionTooltip>
          </div>
        </TableCell>
      </TableRow>
    </DocumentContextMenu>
  );
}
