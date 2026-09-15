import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../../types";
import type { TenantDocument, DocumentStatus } from "./types";
import { downloadDocumentFile } from "./document-templates";
import { useDocumentsLocalStorage, getTenantStorageFolder } from "./useDocumentsLocalStorage";
import { useDocumentUpload } from "./useDocumentUpload";

export { getTenantStorageFolder };

export function useOrgDocumentsState(org: EnrichedOrganization) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [previewDoc, setPreviewDoc] = useState<TenantDocument | null>(null);

  const { storageFolder, documents, saveDocuments } = useDocumentsLocalStorage(org);

  const {
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
  } = useDocumentUpload({
    org,
    storageFolder,
    documents,
    saveDocuments,
  });

  const kycSummary = useMemo(() => {
    const totalDocs = documents.length;
    const verifiedCount = documents.filter((d) => d.status === "VERIFIED" || d.status === "ACTIVE").length;
    const pendingCount = documents.filter((d) => d.status === "PENDING_REVIEW").length;
    const revisionCount = documents.filter((d) => d.status === "REVISION_REQUIRED" || d.status === "REJECTED").length;
    const completionPercent = totalDocs > 0 ? Math.round((verifiedCount / totalDocs) * 100) : 0;

    let overallKycStatus: "VERIFIED" | "PENDING" | "REVISION" | "INCOMPLETE" = "INCOMPLETE";
    if (totalDocs > 0 && verifiedCount === totalDocs) {
      overallKycStatus = "VERIFIED";
    } else if (revisionCount > 0) {
      overallKycStatus = "REVISION";
    } else if (pendingCount > 0) {
      overallKycStatus = "PENDING";
    }

    return {
      totalDocs,
      verifiedCount,
      pendingCount,
      revisionCount,
      completionPercent,
      overallKycStatus,
    };
  }, [documents]);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "ALL" || doc.category === selectedCategory;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PENDING" && doc.status === "PENDING_REVIEW") ||
        (statusFilter === "VERIFIED" && (doc.status === "VERIFIED" || doc.status === "ACTIVE")) ||
        (statusFilter === "REVISION" && (doc.status === "REVISION_REQUIRED" || doc.status === "REJECTED"));
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [documents, searchQuery, selectedCategory, statusFilter]);

  const handleDelete = (docId: string, docName: string) => {
    const docToDelete = documents.find((d) => d.id === docId);
    const updated = documents.filter((d) => d.id !== docId);
    saveDocuments(updated);

    if (docToDelete && typeof window !== "undefined") {
      const s3Path = `s3://tenant-assets/tenants/${storageFolder}/documents/${docToDelete.category.toLowerCase()}/${docToDelete.name}`;
      const trashItem = {
        id: `trash-doc-${docToDelete.id}-${Date.now()}`,
        name: docToDelete.name,
        type: "DOCUMENT",
        identifier: docToDelete.id,
        originName: org.name,
        deletedAt: new Date().toISOString(),
        deletedBy: "Super Admin",
        daysRemaining: 30,
        details: {
          path: s3Path,
          s3Uri: s3Path,
          orgSlug: storageFolder,
          orgName: org.name,
          category: docToDelete.category,
          sizeBytes: docToDelete.sizeBytes,
          format: docToDelete.format,
          docData: docToDelete,
        },
      };

      try {
        const rawTrash = localStorage.getItem("k2net_system_trash");
        const trashList = rawTrash ? JSON.parse(rawTrash) : [];
        trashList.unshift(trashItem);
        localStorage.setItem("k2net_system_trash", JSON.stringify(trashList));
      } catch (e) {
        console.error("Failed to push to trash", e);
      }
    }

    toast.success(`Dokumen "${docName}" dipindahkan ke Recycle Bin & Data Recovery (Retensi 30 Hari).`);
  };

  const handleDownload = (doc: TenantDocument) => {
    const toastId = toast.loading(`Menyiapkan berkas ${doc.name}...`);
    try {
      downloadDocumentFile(doc, org);
      toast.success(`Berkas ${doc.name} berhasil diunduh.`, { id: toastId });
    } catch {
      toast.error(`Gagal mengunduh berkas ${doc.name}`, { id: toastId });
    }
  };

  const handleUpdateStatus = (
    docId: string,
    newStatus: DocumentStatus,
    reviewNotes?: string
  ) => {
    const targetDoc = documents.find((d) => d.id === docId);
    const nowStr = "Baru saja";

    const nextDocs = documents.map((doc) => {
      if (doc.id === docId) {
        const updated: TenantDocument = {
          ...doc,
          status: newStatus,
          reviewNotes: reviewNotes !== undefined ? reviewNotes : doc.reviewNotes,
          verifiedBy: newStatus === "VERIFIED" ? "Super Admin" : doc.verifiedBy,
          verifiedAt: newStatus === "VERIFIED" ? nowStr : doc.verifiedAt,
        };
        return updated;
      }
      return doc;
    });

    saveDocuments(nextDocs);

    if (previewDoc && previewDoc.id === docId) {
      setPreviewDoc((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              reviewNotes: reviewNotes !== undefined ? reviewNotes : prev.reviewNotes,
              verifiedBy: newStatus === "VERIFIED" ? "Super Admin" : prev.verifiedBy,
              verifiedAt: newStatus === "VERIFIED" ? nowStr : prev.verifiedAt,
            }
          : null
      );
    }

    if (newStatus === "VERIFIED") {
      toast.success(`Dokumen "${targetDoc?.name ?? docId}" berhasil disetujui & diverifikasi.`);
    } else if (newStatus === "REVISION_REQUIRED") {
      toast.warning("Status dokumen diubah menjadi: Memerlukan Revisi.");
    } else if (newStatus === "REJECTED") {
      toast.error("Dokumen ditolak.");
    } else {
      toast.info(`Status dokumen diperbarui: ${newStatus}`);
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    statusFilter,
    setStatusFilter,
    isUploadOpen,
    setIsUploadOpen,
    previewDoc,
    setPreviewDoc,
    newDocName,
    setNewDocName,
    newDocCategory,
    setNewDocCategory,
    newDocFile,
    setNewDocFile,
    uploading,
    documents,
    filteredDocs,
    kycSummary,
    storageFolder,
    handleUploadSubmit,
    handleDelete,
    handleDownload,
    handleUpdateStatus,
  };
}
