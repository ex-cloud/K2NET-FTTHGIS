import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import { Upload, FileText } from "lucide-react";
import type { DocumentCategory } from "./types";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orgName: string;
  newDocName: string;
  setNewDocName: (name: string) => void;
  newDocCategory: DocumentCategory;
  setNewDocCategory: (category: DocumentCategory) => void;
  newDocFile: File | null;
  setNewDocFile: (file: File | null) => void;
  uploading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function DocumentUploadModal({
  isOpen,
  onOpenChange,
  orgName,
  newDocName,
  setNewDocName,
  newDocCategory,
  setNewDocCategory,
  newDocFile,
  setNewDocFile,
  uploading,
  onSubmit,
}: DocumentUploadModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-popover/95 backdrop-blur-xl border-border text-foreground rounded-2xl shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider font-bold">
            <Upload className="h-4 w-4" />
            <span>MinIO S3 Document Vault</span>
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            Unggah Dokumen Tenant
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Unggah dokumen legalitas atau berkas teknis khusus untuk organisasi{" "}
            <strong className="text-foreground">{orgName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Nama Dokumen</Label>
            <Input
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              placeholder="Contoh: MoU-Kerjasama-2026.pdf"
              className="h-9 text-xs bg-card border-border text-foreground"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Kategori Dokumen</Label>
            <Select
              value={newDocCategory}
              onValueChange={(v) => setNewDocCategory(v as DocumentCategory)}
            >
              <SelectTrigger className="h-9 text-xs bg-card border-border text-foreground">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-xs">
                <SelectItem value="LEGAL">LEGAL — MoU & Kontrak B2B</SelectItem>
                <SelectItem value="TECHNICAL">TECHNICAL — BAST & Topologi BRAS</SelectItem>
                <SelectItem value="COMPLIANCE">COMPLIANCE — NIB / NPWP / Izin ISP</SelectItem>
                <SelectItem value="BILLING">BILLING — Bukti Pembayaran / Faktur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Pilih Berkas (PDF / ZIP / KMZ)</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center bg-card/40 hover:bg-card/70 transition-colors cursor-pointer">
              <input
                type="file"
                id="doc-file-upload"
                onChange={(e) => setNewDocFile(e.target.files?.[0] || null)}
                className="hidden"
                accept=".pdf,.zip,.kmz,.kml,.json"
              />
              <label htmlFor="doc-file-upload" className="cursor-pointer block space-y-1.5">
                <FileText className="h-6 w-6 text-muted-foreground mx-auto" />
                <span className="text-xs font-medium text-foreground block">
                  {newDocFile ? newDocFile.name : "Klik untuk memilih berkas dari komputer"}
                </span>
                <span className="text-[10px] text-muted-foreground block font-mono">
                  Maksimum ukuran berkas: 25 MB
                </span>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs border-border"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={uploading}
              className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            >
              {uploading ? "Mengunggah..." : "Simpan Dokumen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
