import { useState } from "react";
import { Button, Input } from "@k2net/ui";
import { ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import type { TenantDocument, DocumentStatus } from "./types";

interface DocumentAuditHeaderProps {
  previewDoc: TenantDocument;
  onUpdateStatus?: (docId: string, status: DocumentStatus, notes?: string) => void;
}

export function DocumentAuditHeader({
  previewDoc,
  onUpdateStatus,
}: DocumentAuditHeaderProps) {
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");

  const handleApprove = () => {
    if (onUpdateStatus) {
      onUpdateStatus(previewDoc.id, "VERIFIED");
    }
  };

  const handleSubmitRevision = () => {
    if (!revisionNote.trim()) return;
    if (onUpdateStatus) {
      onUpdateStatus(previewDoc.id, "REVISION_REQUIRED", revisionNote.trim());
      setIsRevisionMode(false);
      setRevisionNote("");
    }
  };

  return (
    <>
      {/* Super Admin Audit Trail info banner */}
      <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60 text-[11px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>
            Diupload oleh <strong className="text-foreground">{previewDoc.uploadedBy}</strong> ({previewDoc.uploadedAt})
          </span>
          {previewDoc.verifiedBy && (
            <>
              <span>•</span>
              <span>
                Divalidasi oleh <strong className="text-primary">{previewDoc.verifiedBy}</strong> ({previewDoc.verifiedAt})
              </span>
            </>
          )}
        </div>

        {/* Quick verification buttons inside header */}
        {onUpdateStatus && (
          <div className="flex items-center gap-1.5">
            {previewDoc.status !== "VERIFIED" && (
              <Button
                size="sm"
                onClick={handleApprove}
                className="h-6 px-2 text-[10px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1 cursor-pointer"
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Setujui (Verify)</span>
              </Button>
            )}
            {previewDoc.status !== "REVISION_REQUIRED" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRevisionMode(true)}
                className="h-6 px-2 text-[10px] text-amber-500 border-amber-500/30 hover:bg-amber-500/10 gap-1 cursor-pointer"
              >
                <AlertTriangle className="h-3 w-3" />
                <span>Minta Revisi</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Inline revision reason form */}
      {isRevisionMode && (
        <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2">
          <div className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Masukkan Catatan Revisi untuk Tenant:</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="Contoh: Lampirkan SK Izin Penyelenggaraan ISP terbaru yang telah dilegalisir..."
              className="h-7 text-xs bg-card border-border flex-1"
            />
            <Button
              size="sm"
              onClick={handleSubmitRevision}
              className="h-7 px-3 text-xs font-semibold bg-amber-600 text-amber-50 hover:bg-amber-700 cursor-pointer"
            >
              Kirim Revisi
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRevisionMode(false)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* Existing Revision Notes Callout */}
      {previewDoc.reviewNotes && (
        <div className="mt-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Catatan Revisi: {previewDoc.reviewNotes}</span>
        </div>
      )}
    </>
  );
}
