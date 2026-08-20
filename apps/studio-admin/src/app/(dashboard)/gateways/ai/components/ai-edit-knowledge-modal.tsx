"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import { Button } from "@k2net/ui";
import { Input } from "@k2net/ui";
import { Label } from "@k2net/ui";
import {
  CATEGORIES,
  KNOWLEDGE_SCOPES,
  KnowledgeScope,
  KnowledgeStatus,
  formatBytes,
} from "./types";
import {
  AiDocumentItem,
  getAiDocumentDetail,
  updateAiDocument,
} from "@/lib/actions/gateways";
import { toast } from "sonner";
import {
  FileEdit,
  Loader2,
  CheckCircle2,
  FileText,
  Eye,
  Edit3,
  Sparkles,
  Layers,
  Calendar,
} from "lucide-react";

interface AiEditKnowledgeModalProps {
  document: AiDocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AiEditKnowledgeModal({
  document,
  isOpen,
  onClose,
  onSuccess,
}: AiEditKnowledgeModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [scope, setScope] = useState<KnowledgeScope>("GLOBAL");
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  // Load detail whenever modal opens with a document
  useEffect(() => {
    if (!document || !isOpen) return;

    setTitle(document.title);
    setCategory(document.category || "GENERAL");
    setScope(document.scope || "GLOBAL");
    setActiveTab("write");

    if (document.raw_content) {
      setContent(document.raw_content);
    } else {
      setFetchingDetail(true);
      getAiDocumentDetail(document.id)
        .then((detail) => {
          setContent(detail.raw_content || "");
        })
        .catch((err) => {
          toast.error("Gagal memuat isi dokumen asli: " + err.message);
        })
        .finally(() => {
          setFetchingDetail(false);
        });
    }
  }, [document, isOpen]);

  const handleSave = async (targetStatus: KnowledgeStatus, shouldReindex: boolean) => {
    if (!document) return;
    if (!title.trim()) {
      toast.error("Judul dokumen tidak boleh kosong.");
      return;
    }
    if (!content.trim()) {
      toast.error("Konten dokumen tidak boleh kosong.");
      return;
    }

    setLoading(true);
    try {
      await updateAiDocument(document.id, {
        title: title.trim(),
        category,
        scope,
        content: content.trim(),
        status: targetStatus,
        reindex: shouldReindex,
      });

      toast.success(
        targetStatus === "INDEXED"
          ? `Dokumen '${title}' berhasil diperbarui dan dipublikasikan (Re-indexing otomatis berjalan)!`
          : `Dokumen '${title}' berhasil disimpan sebagai revisi (${targetStatus}).`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Gagal menyimpan revisi dokumen: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const estimatedTokens = Math.round(wordCount * 1.3);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <FileEdit className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  Edit & Revisi Pengetahuan
                </DialogTitle>
                <DialogDescription className="text-xs text-foreground/75 dark:text-muted-foreground">
                  ID: <span className="font-mono text-foreground">{document?.id.substring(0, 13)}...</span> • Dibuat:{" "}
                  {document?.created_at ? new Date(document.created_at).toLocaleDateString("id-ID") : "—"}
                </DialogDescription>
              </div>
            </div>

            {/* Scope Badge Preview */}
            {document && (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] uppercase font-semibold text-foreground/75 dark:text-muted-foreground block">
                    Visibilitas Terpilih
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {KNOWLEDGE_SCOPES.find((s) => s.id === scope)?.shortLabel}
                  </span>
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {fetchingDetail ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-foreground/75 dark:text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Memuat isi dokumen asli...</p>
            </div>
          ) : (
            <>
              {/* Form Grid: Title & Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="edit-title" className="text-xs font-semibold text-foreground">
                    Judul Dokumen <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: SOP Troubleshooting OLT ZTE C320"
                    className="h-9 bg-background border-border text-foreground font-medium text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-category" className="text-xs font-semibold text-foreground">
                    Kategori Taksonomi
                  </Label>
                  <select
                    id="edit-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {CATEGORIES.filter((c) => c.id !== "ALL").map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scope Selector: 3 Visual Cards */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Scope Visibilitas & Hak Akses (Multi-Tenant Isolation)</span>
                  <span className="text-[11px] font-normal text-foreground/75 dark:text-muted-foreground">
                    Menentukan batasan pengguna yang boleh memanggil pengetahuan ini via AI RAG
                  </span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {KNOWLEDGE_SCOPES.map((item) => {
                    const isSelected = scope === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setScope(item.id)}
                        className={`p-3 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? `${item.accentBorder} ${item.accentBg} ring-1 ring-primary/40`
                            : "border-border bg-background hover:bg-muted/40 text-foreground"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <Icon className={`h-4 w-4 ${item.color}`} />
                              <span className="text-xs font-semibold text-foreground">
                                {item.shortLabel}
                              </span>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                            )}
                          </div>
                          <p className="text-[11px] text-foreground/75 dark:text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px]">
                          <span className={`font-mono font-medium ${item.color}`}>
                            {item.badge}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content Editor with Tab Bar & Metadata */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span>Isi Dokumen (Format Markdown / Teks)</span>
                  </Label>

                  {/* Write vs Preview Toggle */}
                  <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => setActiveTab("write")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        activeTab === "write"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-foreground/75 dark:text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Edit3 className="h-3 w-3" />
                      Tulis
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("preview")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        activeTab === "preview"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-foreground/75 dark:text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Eye className="h-3 w-3" />
                      Preview
                    </button>
                  </div>
                </div>

                {activeTab === "write" ? (
                  <div className="relative">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="# Tuliskan judul dan SOP teknis di sini...&#10;&#10;## Langkah Pengerjaan:&#10;1. Verifikasi konfigurasi...&#10;2. Gunakan perintah CLI..."
                      rows={12}
                      className="w-full p-3 rounded-lg bg-background border border-border text-foreground font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                    />
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-muted/80 backdrop-blur border border-border text-[10px] text-foreground/75 dark:text-muted-foreground font-mono">
                      {wordCount} kata • {charCount} karakter • ~{estimatedTokens} token
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-background border border-border min-h-[280px] max-h-[360px] overflow-y-auto text-xs leading-relaxed text-foreground prose prose-invert max-w-none">
                    {content ? (
                      <pre className="font-sans whitespace-pre-wrap">{content}</pre>
                    ) : (
                      <p className="text-foreground/75 dark:text-muted-foreground italic">
                        Belum ada konten untuk ditampilkan.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Status & Re-index notice */}
              <div className="rounded-lg p-3 bg-muted/20 border border-border flex items-start gap-2.5 text-xs text-foreground/80">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">Informasi Siklus Vektor & Re-Indexing:</p>
                  <p className="text-[11px] text-foreground/75 dark:text-muted-foreground leading-normal">
                    Jika memilih <strong>Simpan & Publikasikan</strong>, teks markdown akan di-chunk ulang
                    (~500 kata), dihitung vektor embedding barunya, dan langsung aktif untuk semantic similarity RAG
                    sesuai scope visibilitas yang dipilih.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/20 flex items-center justify-between sm:justify-between w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="text-xs border-border text-foreground hover:bg-muted"
          >
            Batal
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleSave("DRAFT", false)}
              disabled={loading || fetchingDetail}
              className="text-xs"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Simpan sebagai Draft
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => handleSave("INDEXED", true)}
              disabled={loading || fetchingDetail}
              className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              Simpan & Publikasikan (Re-Index)
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
