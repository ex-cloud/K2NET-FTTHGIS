import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-compat";
import { uploadTaskAttachment } from "@/lib/storage-client";
import type { EnrichedOrganization } from "../../types";
import type { TenantDocument, DocumentCategory } from "./types";
import { getDocumentTemplate, createBinaryPdfBlob } from "./document-templates";

interface UseDocumentUploadProps {
  org: EnrichedOrganization;
  storageFolder: string;
  documents: TenantDocument[];
  saveDocuments: (docs: TenantDocument[]) => void;
}

export function useDocumentUpload({
  org,
  storageFolder,
  documents,
  saveDocuments,
}: UseDocumentUploadProps) {
  const { data: session } = useSession();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState<DocumentCategory>("LEGAL");
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) {
      toast.error("Nama dokumen wajib diisi.");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Mengunggah dokumen ke MinIO S3 Vault...");

    try {
      const fileName =
        newDocName.endsWith(".pdf") || newDocName.endsWith(".kmz")
          ? newDocName
          : `${newDocName}.pdf`;

      let fileToUpload = newDocFile;
      if (!fileToUpload) {
        const dummyDoc: TenantDocument = {
          id: `temp-${Date.now()}`,
          name: fileName,
          category: newDocCategory,
          sizeBytes: 0,
          format: fileName.endsWith(".kmz") ? "KMZ" : "PDF",
          uploadedBy: session?.user?.name || "Super Admin",
          uploadedAt: "Baru saja",
          status: "VERIFIED",
          downloadUrl: "#",
        };
        const tpl = getDocumentTemplate(dummyDoc, org);
        const pdfBlob = createBinaryPdfBlob(tpl, org);
        fileToUpload = new File([pdfBlob], fileName, { type: "application/pdf" });
      }

      const folder = `tenants/${storageFolder}/documents/${newDocCategory.toLowerCase()}`;
      let remoteUrl = "#";

      try {
        const uploadRes = await uploadTaskAttachment(
          fileToUpload,
          session?.accessToken || undefined,
          "tenant-assets",
          folder
        );
        remoteUrl = uploadRes?.url || "#";
      } catch (uploadErr) {
        console.warn("Storage gateway sync warn (local vault saved):", uploadErr);
      }

      const newDoc: TenantDocument = {
        id: `doc-${Date.now()}`,
        name: fileName,
        category: newDocCategory,
        sizeBytes: fileToUpload.size,
        format: fileName.endsWith(".kmz") ? "KMZ" : "PDF",
        uploadedBy: session?.user?.name || "Super Admin",
        uploadedAt: "Baru saja",
        status: "VERIFIED",
        downloadUrl: remoteUrl,
      };

      const nextDocs = [newDoc, ...documents];
      saveDocuments(nextDocs);
      setIsUploadOpen(false);
      setNewDocName("");
      setNewDocFile(null);
      toast.success(`Dokumen "${newDoc.name}" berhasil tersimpan di Dokumen Vault tenant.`, {
        id: toastId,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Gagal mengunggah dokumen";
      toast.error(errMsg, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return {
    isUploadOpen,
    setIsUploadOpen,
    newDocName,
    setNewDocName,
    newDocCategory,
    setNewDocCategory,
    newDocFile,
    setNewDocFile,
    uploading,
    handleUploadSubmit,
  };
}
