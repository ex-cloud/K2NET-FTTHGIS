import { FileText, FileCode, Lightbulb, FolderKanban, BookOpen, RotateCcw } from "lucide-react";
import { RichTextEditor } from "@k2net/ui";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import {
  TEMPLATE_PLAN_SPEC,
  TEMPLATE_IDEA_RFC,
  TEMPLATE_PROJECT_CHARTER,
  TEMPLATE_DOC_SOP,
  type WorkspaceSubtype,
} from "./new-project-constants";

interface NewProjectEditorSectionProps {
  subtype?: WorkspaceSubtype;
  description: string;
  setDescription: (val: string) => void;
  onUploadImage: (file: File) => Promise<{ url: string; filename?: string }>;
}

export function NewProjectEditorSection({
  subtype = "PLAN",
  description,
  setDescription,
  onUploadImage,
}: NewProjectEditorSectionProps) {
  const { t } = useTranslation();

  const getEditorTitle = () => {
    switch (subtype) {
      case "IDEA":
        return t("workspace.template_idea");
      case "PROJECT":
        return t("workspace.template_project");
      case "DOC":
        return t("workspace.template_doc");
      default:
        return t("workspace.template_plan");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span>{getEditorTitle()} (TipTap Markdown)</span>
        </label>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground hidden sm:inline">Templates:</span>
          <button
            type="button"
            onClick={() => {
              setDescription(TEMPLATE_PLAN_SPEC);
              toast.info(t("workspace.template_plan"));
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted/60 border border-border/60 text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <FileCode className="w-3 h-3 text-muted-foreground" />
            <span>{t("workspace.template_plan")}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDescription(TEMPLATE_IDEA_RFC);
              toast.info(t("workspace.template_idea"));
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted/60 border border-border/60 text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Lightbulb className="w-3 h-3 text-muted-foreground" />
            <span>{t("workspace.template_idea")}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDescription(TEMPLATE_PROJECT_CHARTER);
              toast.info(t("workspace.template_project"));
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted/60 border border-border/60 text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <FolderKanban className="w-3 h-3 text-muted-foreground" />
            <span>{t("workspace.template_project")}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDescription(TEMPLATE_DOC_SOP);
              toast.info(t("workspace.template_doc"));
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted/60 border border-border/60 text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <BookOpen className="w-3 h-3 text-muted-foreground" />
            <span>{t("workspace.template_doc")}</span>
          </button>
          {description && (
            <button
              type="button"
              onClick={() => setDescription("")}
              title={t("tasks.reset_doc")}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/70 overflow-hidden bg-card/40 focus-within:border-primary/50 transition-colors shadow-xs">
        <RichTextEditor
          value={description}
          onChange={setDescription}
          minHeight="180px"
          placeholder={t("projects.plan_placeholder")}
          onUploadImage={onUploadImage}
        />
      </div>
    </div>
  );
}
