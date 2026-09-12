import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../../types";
import type { TenantDocument, DocumentCategory } from "./types";

export function useOrgDocumentsState(org: EnrichedOrganization) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<TenantDocument | null>(null);

  // Upload Form State
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState<DocumentCategory>("LEGAL");
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Initial Documents Data
  const [documents, setDocuments] = useState<TenantDocument[]>([
    {
      id: "doc-1",
      name: `MoU-SaaS-Enterprise-Agreement-${org.slug.toUpperCase()}-2026.pdf`,
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
      name: `BAST-Serah-Terima-Onboarding-NOC-${org.slug}.pdf`,
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
      name: `NPWP-NIB-Legalitas-Badan-Hukum-${org.slug}.pdf`,
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
      name: `Topology-Core-Router-BRAS-Interconnect-${org.slug}.kmz`,
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

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) {
      toast.error("Nama dokumen wajib diisi.");
      return;
    }

    setUploading(true);
    setTimeout(() => {
      const newDoc: TenantDocument = {
        id: `doc-${Date.now()}`,
        name: newDocName.endsWith(".pdf") ? newDocName : `${newDocName}.pdf`,
        category: newDocCategory,
        sizeBytes: newDocFile ? newDocFile.size : 1450000,
        format: "PDF",
        uploadedBy: "Super Admin",
        uploadedAt: "Baru saja",
        status: "VERIFIED",
        downloadUrl: "#",
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setUploading(false);
      setIsUploadOpen(false);
      setNewDocName("");
      setNewDocFile(null);
      toast.success(`Dokumen ${newDoc.name} berhasil diunggah ke MinIO S3 Vault.`);
    }, 750);
  };

  const handleDelete = (docId: string, docName: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    toast.success(`Dokumen ${docName} dihapus dari penyimpanan.`);
  };

  const handleDownload = (doc: TenantDocument) => {
    const toastId = toast.loading(`Mengunduh berkas ${doc.name}...`);
    setTimeout(() => {
      toast.success(`Berkas ${doc.name} berhasil diunduh.`, { id: toastId });
    }, 600);
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
    handleUploadSubmit,
    handleDelete,
    handleDownload,
  };
}
