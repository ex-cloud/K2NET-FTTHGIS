import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../../types";
import type { TenantDocument, DocumentCategory } from "./types";

import { downloadDocumentFile } from "./document-templates";

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
      uploadedBy: "Super Admin",
      uploadedAt: "2026-08-01 10:30 WIB",
      expiryDate: "2027-08-01",
      status: "VERIFIED",
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

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "ALL" || doc.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchQuery, selectedCategory]);

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

      const fileToUpload = newDocFile ?? new File(
        [new Blob([`Dokumen ${fileName} untuk organisasi ${org.name}`], { type: "application/pdf" })],
        fileName,
        { type: "application/pdf" }
      );

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

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
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
    storageFolder,
    handleUploadSubmit,
    handleDelete,
    handleDownload,
  };
}
