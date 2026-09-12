import React from "react";
import { UploadCloud, CheckCircle2, FileCode, Loader2, Sparkles, Check } from "lucide-react";
import { Button, Input, Label } from "@k2net/ui";
import { CATEGORIES, KNOWLEDGE_SCOPES, type KnowledgeScope } from "../types";

interface AiUploadKnowledgeFormProps {
  uploadTitle: string;
  setUploadTitle: (t: string) => void;
  uploadCategory: string;
  setUploadCategory: (c: string) => void;
  uploadScope?: KnowledgeScope;
  setUploadScope?: (s: KnowledgeScope) => void;
  uploadAutoApprove?: boolean;
  setUploadAutoApprove?: (a: boolean) => void;
  selectedFile: File | null;
  setSelectedFile: (f: File | null) => void;
  uploading: boolean;
  onUploadSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onGoToTemplates: () => void;
}

export function AiUploadKnowledgeForm({
  uploadTitle,
  setUploadTitle,
  uploadCategory,
  setUploadCategory,
  uploadScope = "GLOBAL",
  setUploadScope,
  uploadAutoApprove = true,
  setUploadAutoApprove,
  selectedFile,
  setSelectedFile,
  uploading,
  onUploadSubmit,
  onCancel,
  onGoToTemplates,
}: AiUploadKnowledgeFormProps) {
  return (
    <form onSubmit={onUploadSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="uploadDocTitle" className="text-xs font-medium text-foreground">
            Judul Dokumen (Opsional)
          </Label>
          <Input
            id="uploadDocTitle"
            type="text"
            placeholder="Default mengikuti nama berkas"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            className="text-xs h-9 bg-background border-border text-foreground"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="uploadDocCategory" className="text-xs font-medium text-foreground">
            Kategori Pengetahuan
          </Label>
          <select
            id="uploadDocCategory"
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          >
            {CATEGORIES.filter((c) => c.id !== "ALL").map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scope Visibilitas Selector */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span>Scope Visibilitas & Hak Akses</span>
          <span className="text-[11px] font-normal text-foreground/75 dark:text-muted-foreground">
            Isolasi Multi-Tenant
          </span>
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {KNOWLEDGE_SCOPES.map((item) => {
            const isSelected = uploadScope === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setUploadScope?.(item.id)}
                className={`p-2.5 rounded-lg border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? `${item.accentBorder} ${item.accentBg} ring-1 ring-primary/40`
                    : "border-border bg-background hover:bg-muted/40 text-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                    <span className="text-xs font-semibold text-foreground">
                      {item.shortLabel}
                    </span>
                  </div>
                  {isSelected && <Check className="h-3 w-3 text-primary" />}
                </div>
                <p className="text-[10px] text-foreground/75 dark:text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Approval / Draft Mode Toggle */}
      <div className="p-3 rounded-lg bg-muted/20 border border-border flex items-center justify-between text-xs">
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground">Mode Approval Dokumen</p>
          <p className="text-[11px] text-foreground/75 dark:text-muted-foreground">
            {uploadAutoApprove
              ? "Langsung dipublikasikan & diindeks ke pgvector (Super Admin)."
              : "Simpan sebagai draf pending untuk di-review terlebih dahulu."}
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={uploadAutoApprove}
            onChange={(e) => setUploadAutoApprove?.(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
        </label>
      </div>

      {/* File Upload Box */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-foreground">Pilih Berkas Dokumen</Label>
        <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-8 text-center bg-muted/10 cursor-pointer relative group">
          <input
            type="file"
            id="fileUploadInput"
            accept=".pdf,.md,.txt"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
              }
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            {selectedFile ? (
              <div>
                <p className="text-sm font-semibold text-primary flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-foreground/75 dark:text-muted-foreground mt-0.5 font-mono">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Klik untuk mengganti berkas
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-foreground">
                  Klik untuk memilih berkas atau geser berkas ke sini
                </p>
                <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-1">
                  Format didukung: PDF, Markdown (.md), atau Plain Text (.txt) hingga 20 MB
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onGoToTemplates}
          className="text-xs gap-1.5 text-foreground/75 dark:text-muted-foreground hover:text-foreground"
        >
          <FileCode className="w-3.5 h-3.5" />
          Lihat Contoh & Template SOP
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={uploading}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={uploading || !selectedFile}
            className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Mengunggah & Vektorisasi...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                {uploadAutoApprove ? "Unggah & Publikasikan" : "Simpan Dokumen (Draft)"}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
