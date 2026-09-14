import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-compat";
import type { EnrichedOrganization } from "../../types";
import type { TenantDocument, DocumentCategory, DocumentStatus } from "./types";

import { downloadDocumentFile, getDocumentTemplate, createBinaryPdfBlob } from "./document-templates";

import { uploadTaskAttachment } from "@/lib/storage-client";

export function getTenantStorageFolder(org: { name: string; slug?: string }): string {
  const cleanName = (org.name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleanName || org.slug || "tenant";
}

function getInitialDocuments(storageFolder: string, org: EnrichedOrganization): TenantDocument[] {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(`k2net_vault_docs_${storageFolder}`);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved vault docs", e);
      }
    }
  }

  const initialList: TenantDocument[] = [
    {
      id: `doc-1-${storageFolder}`,
      name: `MoU-SaaS-Enterprise-Agreement-${storageFolder.toUpperCase()}-2026.pdf`,
      category: "LEGAL",
      sizeBytes: 2450000,
      format: "PDF",
      uploadedBy: "Super Admin (K2NET)",
      uploadedAt: "2026-08-01 10:30 WIB",
      expiryDate: "2027-08-01",
      status: "VERIFIED",
      verifiedBy: "Compliance Legal Lead",
      verifiedAt: "2026-08-01 10:45 WIB",
      downloadUrl: "#",
    },
    {
      id: `doc-2-${storageFolder}`,
      name: `BAST-Serah-Terima-Onboarding-NOC-${storageFolder}.pdf`,
      category: "TECHNICAL",
      sizeBytes: 1820000,
      format: "PDF",
      uploadedBy: "NOC Lead Engineer",
      uploadedAt: "2026-08-02 14:15 WIB",
      status: "VERIFIED",
      verifiedBy: "Lead System Architect",
      verifiedAt: "2026-08-02 15:00 WIB",
      downloadUrl: "#",
    },
    {
      id: `doc-3-${storageFolder}`,
      name: `NPWP-NIB-Legalitas-Badan-Hukum-${storageFolder}.pdf`,
      category: "COMPLIANCE",
      sizeBytes: 950000,
      format: "PDF",
      uploadedBy: org.picName || "Admin Tenant",
      uploadedAt: "2026-08-01 09:12 WIB",
      status: "VERIFIED",
      verifiedBy: "Super Admin",
      verifiedAt: "2026-08-01 09:30 WIB",
      downloadUrl: "#",
    },
    {
      id: `doc-4-${storageFolder}`,
      name: `Topology-Core-Router-BRAS-Interconnect-${storageFolder}.kmz`,
      category: "TECHNICAL",
      sizeBytes: 4200000,
      format: "KMZ",
      uploadedBy: "FTTH Field Team",
      uploadedAt: "2026-08-10 16:45 WIB",
      status: "ACTIVE",
      verifiedBy: "NOC Lead Engineer",
      verifiedAt: "2026-08-10 17:00 WIB",
      downloadUrl: "#",
    },
    {
      id: `doc-5-${storageFolder}`,
      name: `SLA-Commitment-Guarantee-99.5-Tier.pdf`,
      category: "LEGAL",
      sizeBytes: 1100000,
      format: "PDF",
      uploadedBy: "Legal Ops K2NET",
      uploadedAt: "2026-08-01 11:00 WIB",
      expiryDate: "2027-08-01",
      status: "ACTIVE",
      downloadUrl: "#",
    },
  ];

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`k2net_vault_docs_${storageFolder}`, JSON.stringify(initialList));
    } catch (e) {
      console.error("Failed to seed initial vault docs to localStorage", e);
    }
  }

  return initialList;
}

export function useOrgDocumentsState(org: EnrichedOrganization) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<TenantDocument | null>(null);

  const storageFolder = useMemo(() => getTenantStorageFolder(org), [org]);

  // Upload Form State
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState<DocumentCategory>("LEGAL");
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Documents State with LocalStorage Sync per Tenant
  const [documents, setDocuments] = useState<TenantDocument[]>(() =>
    getInitialDocuments(storageFolder, org)
  );

  useEffect(() => {
    setDocuments(getInitialDocuments(storageFolder, org));
  }, [storageFolder, org]);

  const saveDocuments = useCallback(
    (newDocs: TenantDocument[]) => {
      setDocuments(newDocs);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`k2net_vault_docs_${storageFolder}`, JSON.stringify(newDocs));
        } catch (e) {
          console.error("Failed to save vault docs to localStorage", e);
        }
      }
    },
    [storageFolder]
  );

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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) {
      toast.error("Nama dokumen wajib diisi.");
      return;
    }

    setUploading(true);
    const toastId = toast.loading(`Mengunggah dokumen ke MinIO S3 Vault...`);

    try {
      const fileName = newDocName.endsWith(".pdf") || newDocName.endsWith(".kmz")
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
      toast.success(`Dokumen "${newDoc.name}" berhasil tersimpan di Dokumen Vault tenant.`, { id: toastId });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Gagal mengunggah dokumen";
      toast.error(errMsg, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

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
      toast.warning(`Status dokumen diubah menjadi: Memerlukan Revisi.`);
    } else if (newStatus === "REJECTED") {
      toast.error(`Dokumen ditolak.`);
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

