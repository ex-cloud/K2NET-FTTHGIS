

import React from "react";
import { 
  UploadCloud, 
  Loader2 
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  Button, 
  Input, 
  Label 
} from "@k2net/ui";
import { CATEGORIES } from "./types";

interface AiUploadTabProps {
  uploadTitle: string;
  setUploadTitle: (t: string) => void;
  uploadCategory: string;
  setUploadCategory: (c: string) => void;
  selectedFile: File | null;
  setSelectedFile: (f: File | null) => void;
  uploading: boolean;
  onUploadSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function AiUploadTab({
  uploadTitle,
  setUploadTitle,
  uploadCategory,
  setUploadCategory,
  selectedFile,
  setSelectedFile,
  uploading,
  onUploadSubmit,
  onCancel,
}: AiUploadTabProps) {
  return (
    <Card className="border-border bg-card max-w-2xl mx-auto shadow-xs">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Unggah Berkas Pengetahuan SOP / Manual
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Format didukung: PDF, Markdown (.md), atau Plain Text (.txt). Maksimal 20 MB. Sistem otomatis memecah file menjadi token chunks dan menyimpan embedding ke pgvector.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <form onSubmit={onUploadSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="docTitle" className="text-xs">Judul Dokumen (Opsional, default sesuai nama file)</Label>
            <Input
              id="docTitle"
              type="text"
              placeholder="Contoh: SOP Penanganan Alarm LOS ZTE C320"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="docCategory" className="text-xs">Kategori Pengetahuan</Label>
            <select
              id="docCategory"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {CATEGORIES.filter((c) => c.id !== "ALL").map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Pilih Berkas</Label>
            <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-6 text-center bg-muted/20 cursor-pointer">
              <input
                type="file"
                id="fileUpload"
                accept=".pdf,.md,.txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <label htmlFor="fileUpload" className="cursor-pointer block space-y-2">
                <UploadCloud className="w-8 h-8 mx-auto text-primary" />
                <div className="text-xs text-foreground font-medium">
                  {selectedFile ? (
                    <span className="text-primary font-semibold font-mono">{selectedFile.name}</span>
                  ) : (
                    "Klik untuk memilih berkas atau geser file ke sini"
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  PDF, MD, atau TXT hingga 20 MB
                </div>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!selectedFile || uploading}
              className="gap-1.5"
            >
              {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {uploading ? "Mengunggah & Indexing..." : "Unggah & Simpan ke Memori"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
