"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UploadCloud, Database, FileCode } from "lucide-react";
import { Badge, Button, ActionTooltip } from "@k2net/ui";
import { toast } from "sonner";
import { AiPageWrapper } from "@/components/page-guards/ai-page-wrapper";
import { createManualAiDocument } from "@/lib/actions/gateways";
import { AiAddKnowledgeTab } from "../../gateways/ai/components/ai-add-knowledge-tab";
import { KnowledgeScope, KNOWLEDGE_TEMPLATES } from "../../gateways/ai/components/types";

function AiAddContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Upload State
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("GENERAL");
  const [uploadScope, setUploadScope] = useState<KnowledgeScope>("GLOBAL");
  const [uploadAutoApprove, setUploadAutoApprove] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Manual State
  const [manualTitle, setManualTitle] = useState("");
  const [manualCategory, setManualCategory] = useState("GENERAL");
  const [manualScope, setManualScope] = useState<KnowledgeScope>("GLOBAL");
  const [manualAutoApprove, setManualAutoApprove] = useState(true);
  const [manualIsDraft, setManualIsDraft] = useState(false);
  const [manualContent, setManualContent] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  useEffect(() => {
    const templateTitle = searchParams.get("template");
    if (templateTitle) {
      const template = KNOWLEDGE_TEMPLATES.find((t) => t.title === templateTitle);
      if (template) {
        setManualTitle(template.title);
        setManualCategory(template.category);
        setManualContent(template.content);
        toast.info(`Template '${template.title}' dimuat.`);
      }
    }
  }, [searchParams]);

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
      formData.append("scope", uploadScope);
      formData.append("auto_approve", String(uploadAutoApprove));

      const res = await fetch("/api/v1/ai/documents", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success(
          uploadAutoApprove
            ? `Dokumen "${uploadTitle || selectedFile.name}" berhasil diunggah dan diindeks ke pgvector!`
            : `Dokumen "${uploadTitle || selectedFile.name}" berhasil diunggah sebagai draf pending review.`
        );
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
        scope: manualScope,
        content: manualContent,
        auto_approve: manualAutoApprove,
        is_draft: !manualAutoApprove,
      });
      if (res && res.id) {
        toast.success(
          manualAutoApprove
            ? `SOP "${manualTitle}" berhasil disimpan & diindeks ke pgvector!`
            : `SOP "${manualTitle}" berhasil disimpan sebagai draf pending review.`
        );
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
            <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
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
        uploadScope={uploadScope}
        setUploadScope={setUploadScope}
        uploadAutoApprove={uploadAutoApprove}
        setUploadAutoApprove={setUploadAutoApprove}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        uploading={uploading}
        onUploadSubmit={handleUploadSubmit}
        manualTitle={manualTitle}
        setManualTitle={setManualTitle}
        manualCategory={manualCategory}
        setManualCategory={setManualCategory}
        manualScope={manualScope}
        setManualScope={setManualScope}
        manualAutoApprove={manualAutoApprove}
        setManualAutoApprove={setManualAutoApprove}
        manualIsDraft={manualIsDraft}
        setManualIsDraft={setManualIsDraft}
        manualContent={manualContent}
        setManualContent={setManualContent}
        manualSubmitting={manualSubmitting}
        onManualSubmit={handleManualSubmit}
        onCancel={() => router.push("/ai")}
        onGoToTemplates={() => router.push("/ai/templates")}
      />

    </div>
  );
}

export default function AiAddPage() {
  return (
    <AiPageWrapper>
      <Suspense fallback={<div className="p-6 text-xs text-foreground/75 dark:text-muted-foreground">Memuat Ingestion Studio...</div>}>
        <AiAddContent />
      </Suspense>
    </AiPageWrapper>
  );
}
