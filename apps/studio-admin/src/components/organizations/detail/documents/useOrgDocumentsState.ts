import { useState, useMemo } from "react";
import { toast } from "sonner";
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

export function useOrgDocumentsState(org: EnrichedOrganization) {
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

  // Initial Documents Data
  const [documents, setDocuments] = useState<TenantDocument[]>([
    {
      id: "doc-1",
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
      id: "doc-2",
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
      id: "doc-3",
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
      id: "doc-4",
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
      id: "doc-5",
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
  ]);

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
          id: "temp",
          name: fileName,
          category: newDocCategory,
          sizeBytes: 0,
          format: fileName.endsWith(".kmz") ? "KMZ" : "PDF",
          uploadedBy: "Super Admin",
          uploadedAt: "Baru saja",
          status: "VERIFIED",
          downloadUrl: "#",
        };
        const tpl = getDocumentTemplate(dummyDoc, org);
        const pdfBlob = createBinaryPdfBlob(tpl, org);
        fileToUpload = new File([pdfBlob], fileName, { type: "application/pdf" });
      }

      const folder = `tenants/${storageFolder}/documents/${newDocCategory.toLowerCase()}`;
      const uploadRes = await uploadTaskAttachment(
        fileToUpload,
        undefined,
        "tenant-assets",
        folder
      );

      const newDoc: TenantDocument = {
        id: `doc-${Date.now()}`,
        name: fileName,
        category: newDocCategory,
        sizeBytes: fileToUpload.size,
        format: fileName.endsWith(".kmz") ? "KMZ" : "PDF",
        uploadedBy: "Super Admin",
        uploadedAt: "Baru saja",
        status: "VERIFIED",
        downloadUrl: uploadRes.url,
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setIsUploadOpen(false);
      setNewDocName("");
      setNewDocFile(null);
      toast.success(`Dokumen ${newDoc.name} berhasil tersinkron ke MinIO S3 Vault.`, { id: toastId });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Gagal mengunggah dokumen";
      toast.error(errMsg, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (docId: string, docName: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    toast.success(`Dokumen ${docName} dihapus dari penyimpanan.`);
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

    setDocuments((prev) =>
      prev.map((doc) => {
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
      })
    );

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
