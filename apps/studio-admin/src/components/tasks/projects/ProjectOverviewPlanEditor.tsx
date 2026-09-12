import { useState, useCallback } from "react";
import { FileText, Save, Check, Loader2 } from "lucide-react";
import { Button, RichTextEditor } from "@k2net/ui";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-compat";
import { type Task } from "@/hooks/useTasksQuery";

interface ProjectOverviewPlanEditorProps {
  description: string;
  setDescription: (desc: string) => void;
  onSaveField: (fields: Partial<Task>) => Promise<void>;
}

export function ProjectOverviewPlanEditor({
  description,
  setDescription,
  onSaveField,
}: ProjectOverviewPlanEditorProps) {
  const { data: session } = useSession();
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Manual save handler for TipTap document
  const handleSaveDocument = async () => {
    setIsSavingPlan(true);
    try {
      await onSaveField({ description });
      setLastSaved(new Date());
      toast.success("Spesifikasi Rencana Proyek berhasil disimpan");
    } catch {
      toast.error("Gagal menyimpan dokumen rencana proyek");
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Image upload handler via MinIO storage-client
  const handleUploadImage = useCallback(
    async (file: File): Promise<{ url: string; filename?: string }> => {
      try {
        const { uploadTaskAttachment } = await import("@/lib/storage-client");
        const res = await uploadTaskAttachment(file, session?.accessToken ?? undefined);
        if (res && res.url) {
          toast.success(`Gambar ${file.name} berhasil diunggah ke MinIO`);
          return { url: res.url, filename: file.name };
        }
        throw new Error("Invalid storage upload response");
      } catch (err: unknown) {
        toast.error("Gagal mengunggah gambar: " + (err instanceof Error ? err.message : "Storage error"));
        throw err;
      }
    },
    [session?.accessToken]
  );

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span>Project Plan Specification</span>
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Dokumen arsitektur, rincian teknis, dan lingkup inisiatif (TipTap Markdown WYSIWYG)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 hidden sm:inline-flex">
              <Check className="w-3 h-3 text-primary" />
              <span>Tersimpan {lastSaved.toLocaleTimeString("id-ID")}</span>
            </span>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleSaveDocument}
            disabled={isSavingPlan}
            className="h-8 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            {isSavingPlan ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Plan</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* TipTap WYSIWYG Editor Container */}
      <div className="rounded-xl border border-border/70 overflow-hidden bg-card/40 focus-within:border-primary/50 transition-colors shadow-xs">
        <RichTextEditor
          value={description}
          onChange={setDescription}
          minHeight="320px"
          placeholder="Tuliskan spesifikasi teknis lengkap, tabel arsitektur, API contracts, atau milestone rencana proyek di sini..."
          onUploadImage={handleUploadImage}
        />
      </div>
    </div>
  );
}
