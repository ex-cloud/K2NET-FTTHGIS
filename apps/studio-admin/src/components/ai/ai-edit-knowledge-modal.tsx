import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  CATEGORIES,
  KNOWLEDGE_SCOPES,
  type KnowledgeScope,
  type KnowledgeStatus,
} from "./types";
import {
  type AiDocumentItem,
  getAiDocumentDetail,
  updateAiDocument,
} from "@/lib/actions/gateways";
import { toast } from "sonner";
import {
  FileEdit,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { AiRichEditor } from "./ai-rich-editor";

interface AiEditKnowledgeModalProps {
  document: AiDocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ScopeSelectorProps {
  scope: KnowledgeScope;
  setScope: (scope: KnowledgeScope) => void;
}

function EditScopeSelector({ scope, setScope }: ScopeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
        <span>{t("ai.scope_multitenant_group")}</span>
        <span className="text-[11px] font-normal text-foreground/75 dark:text-muted-foreground">
          {t("ai.scope_visibility_category")}
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
              className={`p-3 rounded-lg border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? `${item.accentBorder} ${item.accentBg} ring-1 ring-primary/40`
                  : "border-border bg-background hover:bg-muted/40 text-foreground"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-xs font-semibold text-foreground">
                    {item.label}
                  </span>
                </div>
                {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
              </div>
              <p className="text-[11px] text-foreground/75 dark:text-muted-foreground line-clamp-2 leading-relaxed">
                {item.description}
              </p>
              <div className="mt-2 text-[10px] font-mono font-medium text-foreground/80">
                {item.id === "PLATFORM_INTERNAL" && t("ai.scope_platform")}
                {item.id === "TENANT_INTERNAL" && t("ai.scope_tenant")}
                {item.id === "GLOBAL" && t("ai.scope_global")}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface EditFooterProps {
  loading: boolean;
  fetchingDetail: boolean;
  onClose: () => void;
  onSave: (targetStatus: KnowledgeStatus, shouldReindex: boolean) => void;
}

function EditModalFooter({ loading, fetchingDetail, onClose, onSave }: EditFooterProps) {
  const { t } = useTranslation();

  return (
    <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/20 flex items-center justify-between sm:justify-between w-full">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClose}
        disabled={loading}
        className="text-xs border-border text-foreground hover:bg-muted cursor-pointer"
      >
        {t("common.cancel")}
      </Button>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onSave("DRAFT", false)}
          disabled={loading || fetchingDetail}
          className="text-xs cursor-pointer"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
          {t("ai.save_as_draft")}
        </Button>

        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => onSave("INDEXED", true)}
          disabled={loading || fetchingDetail}
          className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
          )}
          {t("ai.save_and_publish")}
        </Button>
      </div>
    </DialogFooter>
  );
}

export function AiEditKnowledgeModal({
  document,
  isOpen,
  onClose,
  onSuccess,
}: AiEditKnowledgeModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [scope, setScope] = useState<KnowledgeScope>("GLOBAL");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!document || !isOpen) {
      setTitle("");
      setContent("");
      return;
    }

    setTitle(document.title);
    setCategory(document.category || "GENERAL");
    setScope((document.scope as KnowledgeScope) || "GLOBAL");
    setContent(document.raw_content || "");

    setFetchingDetail(true);
    getAiDocumentDetail(document.id)
      .then((detail) => {
        if (detail?.raw_content) setContent(detail.raw_content);
        if (detail?.title) setTitle(detail.title);
        if (detail?.category) setCategory(detail.category);
        if (detail?.scope) setScope(detail.scope as KnowledgeScope);
      })
      .catch((err) => {
        console.error("Gagal memuat detail dokumen:", err);
        toast.error(t("common.error") + ": " + err.message);
      })
      .finally(() => {
        setFetchingDetail(false);
      });
  }, [document, isOpen, t]);

  const handleSave = async (targetStatus: KnowledgeStatus, shouldReindex: boolean) => {
    if (!document) return;
    if (!title.trim()) {
      toast.error(t("common.required_field") + ": " + t("ai.doc_title"));
      return;
    }
    if (!content.trim()) {
      toast.error(t("common.required_field") + ": " + t("ai.doc_content"));
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
          ? `${t("common.success")}: ${title} (${t("ai.save_and_publish")})`
          : `${t("common.success")}: ${title} (${t("ai.save_as_draft")})`
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(t("common.error") + ": " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border shadow-lg">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <FileEdit className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  {t("ai.edit_doc_title")}
                </DialogTitle>
                <DialogDescription className="text-xs text-foreground/75 dark:text-muted-foreground">
                  ID: <span className="font-mono text-foreground">{document?.id.substring(0, 13)}...</span> • {t("billing.date") || "Date"}:{" "}
                  {document?.created_at ? new Date(document.created_at).toLocaleDateString("id-ID") : "—"}
                </DialogDescription>
              </div>
            </div>

            {document && (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] uppercase font-semibold text-foreground/75 dark:text-muted-foreground block">
                    {t("ai.doc_scope")}
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {KNOWLEDGE_SCOPES.find((s) => s.id === scope)?.shortLabel}
                  </span>
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
          {fetchingDetail && !content ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-foreground/75 dark:text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">{t("common.loading")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="edit-title" className="text-xs font-semibold text-foreground">
                    {t("ai.doc_title")} <span className="text-destructive">*</span>
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
                    {t("ai.prompt_category")}
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

              <EditScopeSelector scope={scope} setScope={setScope} />

              <div className="space-y-1.5">
                <Label htmlFor="edit-content" className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span>{t("ai.doc_content")} (WYSIWYG / Markdown)</span>
                    <span className="text-destructive">*</span>
                  </div>
                </Label>
                <AiRichEditor
                  value={content}
                  onChange={(val) => setContent(val)}
                  placeholder="# Tuliskan judul dan SOP teknis di sini...&#10;&#10;## Langkah Pengerjaan:&#10;1. Verifikasi konfigurasi...&#10;2. Gunakan tabel untuk parameter..."
                  disabled={fetchingDetail || loading}
                  minHeight="320px"
                />
              </div>

              <div className="rounded-lg p-3 bg-muted/20 border border-border flex items-start gap-2.5 text-xs text-foreground/80">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">{t("ai.sim_card_title")}:</p>
                  <p className="text-[11px] text-foreground/75 dark:text-muted-foreground leading-normal">
                    {t("ai.sim_card_subtitle")}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <EditModalFooter
          loading={loading}
          fetchingDetail={fetchingDetail}
          onClose={onClose}
          onSave={handleSave}
        />
      </DialogContent>
    </Dialog>
  );
}
