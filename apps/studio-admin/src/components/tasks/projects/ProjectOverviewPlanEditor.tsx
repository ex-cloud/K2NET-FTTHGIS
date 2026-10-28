import { useCallback } from "react";
import { FileText, Lightbulb, BookOpen, FolderKanban } from "lucide-react";
import { RichTextEditor } from "@k2net/ui";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import { useSession } from "@/lib/auth-compat";
import { type Task } from "@/hooks/useTasksQuery";
import { cn } from "@/lib/utils";

type WorkspaceDocType = "PLAN" | "IDEA" | "DOC" | "PROJECT";

interface ProjectOverviewPlanEditorProps {
  title: string;
  setTitle: (title: string) => void;
  originalTitle: string;
  description: string;
  setDescription: (desc: string) => void;
  onSaveField: (fields: Partial<Task>) => Promise<void>;
  docType: WorkspaceDocType;
}

function getSubtypeVisuals(docType: WorkspaceDocType, t: (key: string) => string) {
  switch (docType) {
    case "IDEA":
      return {
        Icon: Lightbulb,
        iconContainerClass: "bg-muted/70 border-border/80 text-foreground",
        typeLabel: t("workspace.idea_spec_title"),
      };
    case "DOC":
      return {
        Icon: BookOpen,
        iconContainerClass: "bg-muted/70 border-border/80 text-foreground",
        typeLabel: t("workspace.doc_spec_title"),
      };
    case "PROJECT":
      return {
        Icon: FolderKanban,
        iconContainerClass: "bg-muted/70 border-border/80 text-foreground",
        typeLabel: t("workspace.project_spec_title"),
      };
    default:
      return {
        Icon: FileText,
        iconContainerClass: "bg-muted/70 border-border/80 text-foreground",
        typeLabel: t("workspace.plan_spec_title"),
      };
  }
}

export function ProjectOverviewPlanEditor({
  title,
  setTitle,
  originalTitle,
  description,
  setDescription,
  onSaveField,
  docType,
}: ProjectOverviewPlanEditorProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { Icon: TypeIcon, iconContainerClass, typeLabel } = getSubtypeVisuals(docType, t);

  // Image upload handler via MinIO storage-client
  const handleUploadImage = useCallback(
    async (file: File): Promise<{ url: string; filename?: string }> => {
      try {
        const { uploadTaskAttachment } = await import("@/lib/storage-client");
        const res = await uploadTaskAttachment(file, session?.accessToken ?? undefined);
        if (res && res.url) {
          toast.success(t("projects.image_uploaded", { name: file.name }));
          return { url: res.url, filename: file.name };
        }
        throw new Error("Invalid storage upload response");
      } catch (err: unknown) {
        toast.error(
          t("projects.image_upload_fail", {
            error: err instanceof Error ? err.message : "Storage error",
          })
        );
        throw err;
      }
    },
    [session?.accessToken, t]
  );

  return (
    <div className="flex-1 rounded-2xl border border-border/70 overflow-hidden bg-card/40 focus-within:border-border transition-colors shadow-xs flex flex-col">
      {/* ── Document Canvas Header: Subtype Pill + Inline Editable H1 Title ── */}
      <div className="p-4 sm:p-6 pb-4 border-b border-border/40 bg-card/60 space-y-2.5">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center shrink-0 border transition-colors shadow-2xs",
              iconContainerClass
            )}
          >
            <TypeIcon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
            {typeLabel}
          </span>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            if (title.trim() && title.trim() !== originalTitle) {
              onSaveField({ title: title.trim() });
            }
          }}
          placeholder={t("workspace.title_placeholder")}
          className="text-2xl sm:text-3xl font-extrabold text-foreground bg-transparent border-0 outline-none w-full tracking-tight hover:bg-muted/10 px-2 -mx-2 py-1 rounded-lg transition-colors placeholder:text-muted-foreground/40"
        />
      </div>

      {/* ── TipTap WYSIWYG Editor Body ── */}
      <div className="flex-1 min-h-[500px]">
        <RichTextEditor
          value={description}
          onChange={setDescription}
          minHeight="500px"
          borderless={true}
          placeholder={t("projects.plan_placeholder")}
          onUploadImage={handleUploadImage}
        />
      </div>
    </div>
  );
}
