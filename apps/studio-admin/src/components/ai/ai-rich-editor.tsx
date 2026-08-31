

import React, { useCallback } from "react";
import { RichTextEditor, RichTextEditorProps } from "@k2net/ui";
import { uploadKnowledgeImage } from "@/lib/actions/gateways";
import { toast } from "sonner";

export interface AiRichEditorProps extends Omit<RichTextEditorProps, "onUploadImage"> {
  onUploadImage?: (file: File) => Promise<{ url: string; filename?: string }>;
}

export function AiRichEditor(props: AiRichEditorProps) {
  const handleUploadImage = useCallback(
    async (file: File) => {
      const toastId = toast.loading("Mengunggah gambar ke MinIO S3...");
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await uploadKnowledgeImage(formData);
        toast.success("Gambar berhasil diunggah ke MinIO S3!", { id: toastId });
        return { url: res.url, filename: res.filename || file.name };
      } catch (err: any) {
        toast.error("Gagal mengunggah gambar ke MinIO S3: " + err.message, { id: toastId });
        throw err;
      }
    },
    []
  );

  return (
    <RichTextEditor
      {...props}
      onUploadImage={props.onUploadImage || handleUploadImage}
    />
  );
}

export default AiRichEditor;
