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
import { useTranslation } from "@k2net/i18n";

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
  const { t } = useTranslation();
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-popover/95 backdrop-blur-xl border-border text-foreground rounded-2xl shadow-lg p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider font-bold">
            <Upload className="h-4 w-4" />
            <span>MinIO S3 Document Vault</span>
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            Upload Tenant Document
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Upload legal documents or technical files specifically for organization{" "}
            <strong className="text-foreground">{orgName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Document Name
            </Label>
            <Input
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              placeholder="e.g. MoU-Partnership-2026.pdf"
              className="h-9 text-xs bg-card border-border text-foreground"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Document Category</Label>
            <Select
              value={newDocCategory}
              onValueChange={(v) => setNewDocCategory(v as DocumentCategory)}
            >
              <SelectTrigger className="h-9 text-xs bg-card border-border text-foreground">
                <SelectValue placeholder={t("common.select_option")} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-xs">
                <SelectItem value="LEGAL">LEGAL — MoU &amp; B2B Contract</SelectItem>
                <SelectItem value="TECHNICAL">TECHNICAL — BAST &amp; BRAS Topology</SelectItem>
                <SelectItem value="COMPLIANCE">COMPLIANCE — NIB / Tax ID / ISP License</SelectItem>
                <SelectItem value="BILLING">BILLING — Payment Proof / Invoice</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Select File (PDF / ZIP / KMZ)</Label>
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
                  {newDocFile ? newDocFile.name : "Click to select file from your computer"}
                </span>
                <span className="text-[10px] text-muted-foreground block font-mono">
                  Maximum file size: 25 MB
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
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={uploading}
              className="h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            >
              {uploading ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
