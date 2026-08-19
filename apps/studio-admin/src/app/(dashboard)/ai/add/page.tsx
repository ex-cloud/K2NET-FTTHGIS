"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Database, FileCode } from "lucide-react";
import { Badge, Button, ActionTooltip } from "@k2net/ui";
import { toast } from "sonner";
import { AiPageWrapper } from "@/components/page-guards/ai-page-wrapper";
import { createManualAiDocument } from "@/lib/actions/gateways";
import { AiAddKnowledgeTab } from "../../gateways/ai/components/ai-add-knowledge-tab";

export default function AiAddPage() {
  const router = useRouter();

  // Upload State
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("GENERAL_SOP");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Manual State
  const [manualTitle, setManualTitle] = useState("");
  const [manualCategory, setManualCategory] = useState("GENERAL_SOP");
  const [manualContent, setManualContent] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Silakan pilih berkas PDF/Markdown/TXT terlebih dahulu");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", uploadTitle || selectedFile.name);
      formData.append("category", uploadCategory);

      const res = await fetch("/api/v1/ai/documents", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success(`Dokumen "${uploadTitle || selectedFile.name}" berhasil diindeks ke pgvector!`);
        router.push("/ai");
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error(errJson.detail || "Gagal mengunggah dokumen ke microservice AI");
      }
    } catch {
      toast.error("Terjadi kegagalan jaringan saat mengunggah berkas");
    } finally {
      setUploading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualContent.trim()) {
      toast.error("Judul dan isi konten SOP wajib diisi");
      return;
    }

    try {
      setManualSubmitting(true);
      const res = await createManualAiDocument({
        title: manualTitle,
        category: manualCategory,
        content: manualContent,
      });
      if (res && res.id) {
        toast.success(`SOP "${manualTitle}" berhasil disimpan & diindeks ke pgvector!`);
        router.push("/ai");
      } else {
        toast.error("Gagal menyimpan catatan manual");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kegagalan jaringan saat memproses catatan");
    } finally {
      setManualSubmitting(false);
    }
  };

  return (
    <AiPageWrapper>
      <div className="flex-1 w-full bg-background overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  Tambah Basis Pengetahuan
                </h1>
                <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 border-primary/30 text-primary bg-primary/10">
                  Ingestion Studio
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Unggah dokumen teknis (PDF, Markdown, TXT) atau tulis prosedur operasional lapangan secara langsung.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ActionTooltip label="Lihat Daftar Dokumen" shortcut="Esc">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/ai")}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                Lihat Daftar Dokumen
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Katalog Template SOP" shortcut="T">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/ai/templates")}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                Katalog Template SOP
              </Button>
            </ActionTooltip>
          </div>
        </div>

        {/* 2-Column Responsive Form Component */}
        <AiAddKnowledgeTab
          uploadTitle={uploadTitle}
          setUploadTitle={setUploadTitle}
          uploadCategory={uploadCategory}
          setUploadCategory={setUploadCategory}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          uploading={uploading}
          onUploadSubmit={handleUploadSubmit}
          manualTitle={manualTitle}
          setManualTitle={setManualTitle}
          manualCategory={manualCategory}
          setManualCategory={setManualCategory}
          manualContent={manualContent}
          setManualContent={setManualContent}
          manualSubmitting={manualSubmitting}
          onManualSubmit={handleManualSubmit}
          onCancel={() => router.push("/ai")}
          onGoToTemplates={() => router.push("/ai/templates")}
        />

      </div>
    </AiPageWrapper>
  );
}
