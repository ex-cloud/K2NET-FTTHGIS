import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "@/lib/navigation-compat";
import { UploadCloud, Database, FileCode } from "lucide-react";
import { Badge, Button, ActionTooltip } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";
import { AiPageWrapper } from "@/components/page-guards/ai-page-wrapper";
import { createManualAiDocument } from "@/lib/actions/gateways";
import { AiAddKnowledgeTab } from "@/components/ai/ai-add-knowledge-tab";
import { type KnowledgeScope, KNOWLEDGE_TEMPLATES } from "@/components/ai/types";

function AiAddContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

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
        toast.info(t("ai.template_loaded", { title: template.title }));
      }
    }
  }, [searchParams, t]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error(t("ai.select_file_prompt"));
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
        const docName = uploadTitle || selectedFile.name;
        toast.success(
          uploadAutoApprove
            ? t("ai.upload_success_indexed", { title: docName })
            : t("ai.upload_success_draft", { title: docName })
        );
        router.push("/ai");
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error(errJson.detail || t("ai.upload_failed"));
      }
    } catch {
      toast.error(t("ai.upload_network_failed"));
    } finally {
      setUploading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualContent.trim()) {
      toast.error(t("ai.manual_fields_required"));
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
            ? t("ai.manual_success_indexed", { title: manualTitle })
            : t("ai.manual_success_draft", { title: manualTitle })
        );
        router.push("/ai");
      } else {
        toast.error(t("ai.manual_save_failed"));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("ai.upload_network_failed");
      toast.error(message);
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
                {t("ai.add_document_title")}
              </h1>
              <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 border-primary/30 text-primary bg-primary/10">
                {t("ai.ingestion_studio")}
              </Badge>
            </div>
            <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
              {t("ai.add_document_subtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionTooltip label={t("ai.view_doc_list")} shortcut="Esc">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/ai")}
              className="text-xs gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              {t("ai.view_doc_list")}
            </Button>
          </ActionTooltip>
          <ActionTooltip label={t("ai.sop_template_catalog")} shortcut="T">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/ai/templates")}
              className="text-xs gap-1.5 cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5" />
              {t("ai.sop_template_catalog")}
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
  const { t } = useTranslation();

  return (
    <AiPageWrapper>
      <Suspense fallback={<div className="p-6 text-xs text-foreground/75 dark:text-muted-foreground">{t("ai.loading_ingestion")}</div>}>
        <AiAddContent />
      </Suspense>
    </AiPageWrapper>
  );
}
