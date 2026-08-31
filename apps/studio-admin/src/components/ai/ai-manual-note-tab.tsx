

import React from "react";
import { 
  FileText, 
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

interface AiManualNoteTabProps {
  manualTitle: string;
  setManualTitle: (t: string) => void;
  manualCategory: string;
  setManualCategory: (c: string) => void;
  manualContent: string;
  setManualContent: (c: string) => void;
  manualSubmitting: boolean;
  onManualSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function AiManualNoteTab({
  manualTitle,
  setManualTitle,
  manualCategory,
  setManualCategory,
  manualContent,
  setManualContent,
  manualSubmitting,
  onManualSubmit,
  onCancel,
}: AiManualNoteTabProps) {
  return (
    <Card className="border-border bg-card max-w-3xl mx-auto shadow-xs">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Tulis Catatan Teknis / SOP Manual
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Tulis langsung pedoman lapangan, catatan konfigurasi, atau aturan teknis. Mendukung format Markdown untuk tabel, bullet points, dan blok kode.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <form onSubmit={onManualSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="manualTitle" className="text-xs">Judul SOP / Catatan Teknis</Label>
              <Input
                id="manualTitle"
                type="text"
                placeholder="Contoh: Standar Redaman GPON Splitter 1:64"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                required
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manualCategory" className="text-xs">Kategori</Label>
              <select
                id="manualCategory"
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CATEGORIES.filter((c) => c.id !== "ALL").map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manualContent" className="text-xs">Konten Markdown</Label>
            <textarea
              id="manualContent"
              rows={12}
              value={manualContent}
              onChange={(e) => setManualContent(e.target.value)}
              placeholder="# Standar Redaman GPON 1:64&#10;&#10;- Batas minimum: -27 dBm&#10;- Batas ideal: -15 s/d -22 dBm&#10;- Batas saturasi receiver: -8 dBm&#10;&#10;## Perhitungan Splitter:&#10;Splitter 1:64 = redaman nominal ~20.5 dB."
              required
              className="w-full rounded-xl border border-border bg-background p-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary custom-scrollbar leading-relaxed"
            />
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
              disabled={manualSubmitting || !manualTitle.trim() || !manualContent.trim()}
              className="gap-1.5"
            >
              {manualSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {manualSubmitting ? "Menyimpan ke Memori..." : "Simpan Pengetahuan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
