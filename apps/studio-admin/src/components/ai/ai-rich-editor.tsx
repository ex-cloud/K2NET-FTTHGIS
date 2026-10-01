

import React, { useCallback } from "react";
import { RichTextEditor, type RichTextEditorProps } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { uploadKnowledgeImage } from "@/lib/actions/gateways";
import { toast } from "sonner";

export interface AiRichEditorProps extends Omit<RichTextEditorProps, "onUploadImage"> {
  onUploadImage?: (file: File) => Promise<{ url: string; filename?: string }>;
}

export function AiRichEditor(props: AiRichEditorProps) {
  const { t } = useTranslation();

  const handleUploadImage = useCallback(
    async (file: File) => {
      const toastId = toast.loading(t("ai.image_uploading"));
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await uploadKnowledgeImage(formData);
        toast.success(t("ai.image_upload_success"), { id: toastId });
        return { url: res.url, filename: res.filename || file.name };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(t("ai.image_upload_failed") + msg, { id: toastId });
        throw err;
      }
    },
    [t]
  );

  return (
    <RichTextEditor
      {...props}
      onUploadImage={props.onUploadImage || handleUploadImage}
    />
  );
}

export default AiRichEditor;
