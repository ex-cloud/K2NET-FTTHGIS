"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
  Label,
} from "@k2net/ui";
import {
  Upload,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FolderGit2,
  ShieldCheck,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TenantImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedBackupData {
  platform?: string;
  exportedAt?: string;
  organization: {
    name: string;
    slug: string;
    website?: string;
    address?: string;
    plan?: string;
  };
  projects?: Array<{
    name: string;
    code: string;
    region?: string;
  }>;
  summary?: {
    projectsCount?: number;
    nodesCount?: number;
    cablesCount?: number;
    usersCount?: number;
  };
}

export function TenantImportModal({ isOpen, onClose, onSuccess }: TenantImportModalProps) {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedBackupData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileProcess = (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".json")) {
      setParseError("Berkas harus berformat .JSON");
      setFile(null);
      setParsedData(null);
      return;
    }

    setFile(selectedFile);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);

        if (!json.organization || !json.organization.name || !json.organization.slug) {
          throw new Error("Format JSON tidak valid: Objek 'organization' dengan 'name' dan 'slug' diperlukan.");
        }

        setParsedData(json);
      } catch (err: any) {
        setParseError(err?.message || "Gagal membaca berkas JSON");
        setParsedData(null);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImportSubmit = async () => {
    if (!parsedData || !session?.accessToken) return;
    setIsImporting(true);

    try {
      const res = await fetch("/api/v1/organizations/import-backup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          organization: parsedData.organization,
          projects: parsedData.projects || [],
          mode: "create_new",
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(errorText || "Gagal mengimpor cadangan tenant");
      }

      const importedOrg = await res.json();
      toast.success(`Organisasi ${importedOrg.name} (${importedOrg.slug}) berhasil diimpor & diprovisioning!`);
      handleReset();
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Terjadi kesalahan saat mengimpor tenant");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-popover/95 backdrop-blur-xl border-border p-0 overflow-hidden shadow-2xl rounded-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-3 text-foreground border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Impor Cadangan Tenant (.JSON)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-0.5">
                Unggah berkas arsip JSON untuk memulihkan atau membuat tenant baru beserta proyek GIS-nya.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Dropzone Area */}
          {!parsedData ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3",
                dragActive
                  ? "border-primary bg-primary/10"
                  : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/40"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />
              <div className="p-3 rounded-full bg-primary/10 border border-primary/20 text-primary">
                <FileJson className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  Klik untuk memilih berkas atau seret & jatuhkan berkas .JSON di sini
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Mendukung format cadangan resmi FTTH GIS K2NET Enterprise
                </p>
              </div>
            </div>
          ) : (
            /* Parsed File Preview */
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">{file?.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {file?.size ? (file.size / 1024).toFixed(1) + " KB" : ""} • Diekspor:{" "}
                      {parsedData.exportedAt ? new Date(parsedData.exportedAt).toLocaleDateString("id-ID") : "—"}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Organization Details Card */}
              <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">{parsedData.organization.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    Plan: {parsedData.organization.plan || "FREE"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-background border border-border">
                    <span className="text-[10px] text-muted-foreground block">Slug Identitas</span>
                    <span className="font-mono font-semibold text-foreground text-xs">{parsedData.organization.slug}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-background border border-border">
                    <span className="text-[10px] text-muted-foreground block">Keycloak IAM Realm</span>
                    <span className="font-mono font-semibold text-foreground text-xs">{parsedData.organization.slug}</span>
                  </div>
                </div>

                {parsedData.projects && parsedData.projects.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <FolderGit2 className="w-3.5 h-3.5 text-primary" />
                      Proyek GIS yang Termasuk ({parsedData.projects.length}):
                    </Label>
                    <div className="space-y-1 max-h-[100px] overflow-y-auto custom-scrollbar">
                      {parsedData.projects.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border text-xs">
                          <span className="font-medium text-foreground">{p.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{p.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Provisioning Notice */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Proses impor akan otomatis memvalidasi slug, mengonfigurasi <strong>Keycloak Realm ({parsedData.organization.slug})</strong>, dan menginisialisasi entitas organisasi dengan status <strong className="text-primary">ACTIVE</strong>.
                </span>
              </div>
            </div>
          )}

          {parseError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2 text-xs text-destructive">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border/60 bg-muted/20 flex justify-end gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleImportSubmit}
            disabled={!parsedData || isImporting}
            className="text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Mengimpor & Provisioning...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mulai Impor & Provisioning
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
