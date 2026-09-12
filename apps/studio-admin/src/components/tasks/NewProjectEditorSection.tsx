import { FileText, FileCode, Sparkles, RotateCcw } from "lucide-react";
import { RichTextEditor } from "@k2net/ui";
import { toast } from "sonner";
import { TEMPLATE_TECH_SPEC, TEMPLATE_INITIATIVE } from "./new-project-constants";

interface NewProjectEditorSectionProps {
  description: string;
  setDescription: (val: string) => void;
  onUploadImage: (file: File) => Promise<{ url: string; filename?: string }>;
}

export function NewProjectEditorSection({
  description,
  setDescription,
  onUploadImage,
}: NewProjectEditorSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span>Project Plan Specification (TipTap Markdown)</span>
        </label>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground hidden sm:inline">Templates:</span>
          <button
            type="button"
            onClick={() => {
              setDescription(TEMPLATE_TECH_SPEC);
              toast.info("Template Technical Architecture Plan dimuat");
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
          >
            <FileCode className="w-3 h-3 text-cyan-500" />
            <span>Tech Spec</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDescription(TEMPLATE_INITIATIVE);
              toast.info("Template Platform Initiative dimuat");
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Initiative</span>
          </button>
          {description && (
            <button
              type="button"
              onClick={() => setDescription("")}
              title="Reset dokumen"
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
          placeholder="Tuliskan spesifikasi project plan, arsitektur sistem, tabel konfigurasi, dan deliverables teknis di sini..."
          onUploadImage={onUploadImage}
        />
      </div>
    </div>
  );
}
