"use client";

import React, { useState } from "react";
import { 
  UploadCloud, 
  FileText, 
  Loader2, 
  Sparkles, 
  FileCode,
  CheckCircle2,
  Lock,
  Building2,
  Globe2,
  ShieldCheck,
  Check,
  Eye,
  Edit3,
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Input, 
  Label 
} from "@k2net/ui";
import { cn } from "@/lib/utils";
import { CATEGORIES, KNOWLEDGE_SCOPES, KnowledgeScope } from "./types";

interface AiAddKnowledgeTabProps {
  // Upload State & Handlers
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

  // Manual State & Handlers
  manualTitle: string;
  setManualTitle: (t: string) => void;
  manualCategory: string;
  setManualCategory: (c: string) => void;
  manualScope?: KnowledgeScope;
  setManualScope?: (s: KnowledgeScope) => void;
  manualAutoApprove?: boolean;
  setManualAutoApprove?: (a: boolean) => void;
  manualIsDraft?: boolean;
  setManualIsDraft?: (d: boolean) => void;
  manualContent: string;
  setManualContent: (c: string) => void;
  manualSubmitting: boolean;
  onManualSubmit: (e: React.FormEvent) => void;

  onCancel: () => void;
  onGoToTemplates: () => void;
}

export function AiAddKnowledgeTab({
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
  manualTitle,
  setManualTitle,
  manualCategory,
  setManualCategory,
  manualScope = "GLOBAL",
  setManualScope,
  manualAutoApprove = true,
  setManualAutoApprove,
  manualIsDraft = false,
  setManualIsDraft,
  manualContent,
  setManualContent,
  manualSubmitting,
  onManualSubmit,
  onCancel,
  onGoToTemplates,
}: AiAddKnowledgeTabProps) {
  const [entryMode, setEntryMode] = useState<"UPLOAD" | "MANUAL">("UPLOAD");
  const [manualPreviewTab, setManualPreviewTab] = useState<"write" | "preview">("write");

  const wordCount = manualContent.trim() ? manualContent.trim().split(/\s+/).length : 0;
  const estimatedTokens = Math.round(wordCount * 1.3);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Segmented Mode Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            {entryMode === "UPLOAD" ? <UploadCloud className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Tambah Basis Pengetahuan SOP & Panduan Jaringan
            </h2>
            <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
              Pilih metode input: Unggah berkas dokumen (PDF, MD, TXT) atau tulis catatan SOP langsung melalui editor Markdown.
            </p>
          </div>
        </div>

        {/* Mode Switcher Pill */}
        <div className="inline-flex p-1 bg-background border border-border rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setEntryMode("UPLOAD")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              entryMode === "UPLOAD"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-foreground/75 dark:text-muted-foreground hover:text-foreground"
            )}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Unggah Berkas</span>
          </button>
          <button
            type="button"
            onClick={() => setEntryMode("MANUAL")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              entryMode === "MANUAL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-foreground/75 dark:text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tulis Manual</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Main Form - 7 cols) */}
        <div className="lg:col-span-7">
          <Card glowingEffect className="border-border bg-card shadow-xs p-0 overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                {entryMode === "UPLOAD" ? (
                  <>
                    <UploadCloud className="w-4 h-4 text-primary" />
                    <span>Unggah Dokumen Baru (PDF / Markdown / TXT)</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Editor Catatan SOP & Prosedur Lapangan</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              {/* ── MODE 1: UNGGAH BERKAS ─────────────────────────────────────────── */}
              {entryMode === "UPLOAD" && (
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
                      <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
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
              )}

              {/* ── MODE 2: TULIS MANUAL ───────────────────────────────────────────── */}
              {entryMode === "MANUAL" && (
                <form onSubmit={onManualSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="manualDocTitle" className="text-xs font-medium text-foreground">
                        Judul SOP / Catatan Teknis <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="manualDocTitle"
                        type="text"
                        placeholder="Contoh: Standar Redaman GPON 1:64"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        required
                        className="text-xs h-9 bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="manualDocCategory" className="text-xs font-medium text-foreground">
                        Kategori
                      </Label>
                      <select
                        id="manualDocCategory"
                        value={manualCategory}
                        onChange={(e) => setManualCategory(e.target.value)}
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
                        const isSelected = manualScope === item.id;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setManualScope?.(item.id)}
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

                  {/* Mode Simpan Draft vs Publikasi */}
                  <div className="p-3 rounded-lg bg-muted/20 border border-border flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">Mode Approval Dokumen</p>
                      <p className="text-[11px] text-foreground/75 dark:text-muted-foreground">
                        {manualAutoApprove
                          ? "Langsung dipublikasikan & diindeks ke pgvector (Super Admin)."
                          : "Simpan sebagai draf pending untuk di-review terlebih dahulu."}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={manualAutoApprove}
                        onChange={(e) => setManualAutoApprove?.(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Content Editor with Tab Bar & Metadata */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="manualDocContent" className="text-xs font-medium text-foreground">
                        Konten Markdown <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={onGoToTemplates}
                          className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          Gunakan Template SOP
                        </button>
                        <div className="flex items-center gap-0.5 bg-muted/40 p-0.5 rounded-lg border border-border">
                          <button
                            type="button"
                            onClick={() => setManualPreviewTab("write")}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                              manualPreviewTab === "write"
                                ? "bg-card text-foreground shadow-xs"
                                : "text-foreground/75 dark:text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Edit3 className="h-3 w-3" />
                            Tulis
                          </button>
                          <button
                            type="button"
                            onClick={() => setManualPreviewTab("preview")}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                              manualPreviewTab === "preview"
                                ? "bg-card text-foreground shadow-xs"
                                : "text-foreground/75 dark:text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Eye className="h-3 w-3" />
                            Preview
                          </button>
                        </div>
                      </div>
                    </div>

                    {manualPreviewTab === "write" ? (
                      <textarea
                        id="manualDocContent"
                        rows={10}
                        placeholder={`# Standar Redaman GPON 1:64\n\n- Batas minimum: -27 dBm\n- Batas ideal: -15 s/d -22 dBm\n- Prosedur perbaikan FO cut...`}
                        value={manualContent}
                        onChange={(e) => setManualContent(e.target.value)}
                        required
                        className="w-full rounded-lg border border-border bg-background p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-y custom-scrollbar"
                      />
                    ) : (
                      <div className="p-4 rounded-lg bg-background border border-border min-h-[220px] max-h-[300px] overflow-y-auto text-xs leading-relaxed text-foreground prose prose-invert max-w-none">
                        {manualContent ? (
                          <pre className="font-sans whitespace-pre-wrap">{manualContent}</pre>
                        ) : (
                          <p className="text-foreground/75 dark:text-muted-foreground italic">
                            Belum ada konten untuk ditampilkan.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="text-[11px] text-foreground/75 dark:text-muted-foreground font-mono">
                      {wordCount} Kata • {manualContent.length} Karakter • ~{estimatedTokens} Token
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onCancel}
                        disabled={manualSubmitting}
                        className="text-xs"
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={manualSubmitting || !manualTitle.trim() || !manualContent.trim()}
                        className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
                      >
                        {manualSubmitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Memvektorisasi...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            {manualAutoApprove ? "Simpan & Publikasikan" : "Simpan sebagai Draf"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Info Guide & Scope Taxonomy - 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 1: Taksonomi 3 Scope Visibilitas */}
          <Card className="border-border bg-card shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-foreground">Scope Visibilitas Multi-Tenant</h3>
                <p className="text-[11px] text-foreground/75 dark:text-muted-foreground">Mencegah kebocoran data rahasia platform (Zero Data Leakage)</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {KNOWLEDGE_SCOPES.map((sc) => {
                const Icon = sc.icon;
                return (
                  <div key={sc.id} className="p-2.5 rounded-lg bg-muted/20 border border-border/50 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${sc.color}`} />
                      <p className="text-xs font-semibold text-foreground">{sc.label}</p>
                    </div>
                    <p className="text-[11px] text-foreground/75 dark:text-muted-foreground leading-relaxed pl-5">
                      {sc.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Card 2: Taksonomi 6 Kategori */}
          <Card className="border-border bg-card shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-foreground">Panduan Taksonomi Pengetahuan</h3>
                <p className="text-[11px] text-foreground/75 dark:text-muted-foreground">Pilih kategori yang tepat agar agen AI mudah mereferensikan</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {CATEGORIES.filter((c) => c.id !== "ALL").map((cat) => (
                <div key={cat.id} className="p-2 rounded-lg bg-muted/20 border border-border/50 flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">{cat.label}</p>
                    <p className="text-[11px] text-foreground/75 dark:text-muted-foreground">
                      {cat.id === "TROUBLESHOOTING" && "Penanganan redaman drop, LOS/Dying Gasp, manual ONT ZTE/Huawei."}
                      {cat.id === "NETWORK_CONFIG" && "Topologi OLT, ODC, ODP, VLAN, dan konfigurasi IP uplink."}
                      {cat.id === "GIS_MANUAL" && "Panduan pemetaan jalur kabel FO, survey tiang, dan koordinat."}
                      {cat.id === "INFRASTRUCTURE" && "Arsitektur server, Docker, Kong, MinIO S3, dan database."}
                      {cat.id === "PLANS" && "Rencana ekspansi rute ODP, budget loss fiber, dan mitigasi risiko."}
                      {cat.id === "GENERAL" && "SOP administrasi, tiket bantuan, tata tertib lapangan, dan kontak darurat."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Card 3: Vector Pipeline Info */}
          <Card className="border-border bg-card/60 shadow-xs p-4 text-xs space-y-2">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              Pipeline Vektorisasi Otomatis (RAG)
            </p>
            <ul className="text-[11px] text-foreground/75 dark:text-muted-foreground space-y-1 list-disc pl-4 leading-relaxed">
              <li>Dokumen dipotong otomatis menjadi chunk 500 token dengan 50 token overlap.</li>
              <li>Embedding dihitung menggunakan model 1536-dimensi dan disimpan di PostgreSQL <span className="font-mono text-primary">pgvector</span>.</li>
              <li>Kueri dicari menggunakan index <span className="font-mono text-primary">HNSW Cosine</span> dengan latensi di bawah 10ms.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
