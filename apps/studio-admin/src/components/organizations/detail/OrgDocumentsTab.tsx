

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  ActionTooltip,
} from "@k2net/ui";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Download,
  Eye,
  Trash2,
  Upload,
  FileCheck,
  FileCode,
  Sparkles,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EnrichedOrganization } from "../types";

interface OrgDocumentsTabProps {
  organization: EnrichedOrganization;
}

export type DocumentCategory = "LEGAL" | "TECHNICAL" | "COMPLIANCE" | "BILLING";

export interface TenantDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  sizeBytes: number;
  format: "PDF" | "ZIP" | "KMZ" | "JSON";
  uploadedBy: string;
  uploadedAt: string;
  expiryDate?: string;
  status: "VERIFIED" | "PENDING_REVIEW" | "ACTIVE" | "EXPIRING_SOON";
  downloadUrl: string;
}

export function OrgDocumentsTab({ organization: org }: OrgDocumentsTabProps) {
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

  return (
    <div className="space-y-6">
      {/* 1. KYC & Legal Verification Banner */}
      <div className="p-4 rounded-xl border border-border bg-card/70 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start md:items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-foreground">B2B Compliance & KYC Verification Status</h3>
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] gap-1 px-2 py-0.5">
                <CheckCircle2 className="h-3 w-3" />
                <span>KYC VERIFIED</span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Dokumen legalitas badan hukum, perizinan ISP Kominfo, dan kontak penanggung jawab terverifikasi valid.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="h-8 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Document</span>
          </Button>
        </div>
      </div>

      {/* 2. Key B2B Document Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: MoU & SaaS Contract */}
        <Card className="p-4 space-y-3 bg-card border-border shadow-xs hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <FileCheck className="h-4 w-4" />
            </div>
            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500 font-mono text-[9px]">
              CONTRACT ACTIVE
            </Badge>
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Perjanjian Kerja Sama (MoU)</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
              Kontrak Induk SaaS FTTH GIS K2NET
            </p>
          </div>
          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
            <span className="font-mono text-muted-foreground">Exp: 01 Aug 2027</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewDoc(documents[0])}
              className="h-6 px-2 text-[10px] text-primary hover:text-primary gap-1"
            >
              <Eye className="h-3 w-3" />
              <span>Preview</span>
            </Button>
          </div>
        </Card>

        {/* Card 2: BAST Serah Terima */}
        <Card className="p-4 space-y-3 bg-card border-border shadow-xs hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[9px]">
              PASSED NOC TEST
            </Badge>
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Berita Acara Serah Terima (BAST)</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
              Onboarding & Integrasi Jaringan Selesai
            </p>
          </div>
          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
            <span className="font-mono text-muted-foreground">Verified 02 Aug 2026</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewDoc(documents[1])}
              className="h-6 px-2 text-[10px] text-primary hover:text-primary gap-1"
            >
              <Eye className="h-3 w-3" />
              <span>Preview</span>
            </Button>
          </div>
        </Card>

        {/* Card 3: SLA Commitment */}
        <Card className="p-4 space-y-3 bg-card border-border shadow-xs hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <Sparkles className="h-4 w-4" />
            </div>
            <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-500 font-mono text-[9px]">
              {org.slaTier}
            </Badge>
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">SLA & Uptime Guarantee</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
              Jaminan Kompensasi Downtime Core Server
            </p>
          </div>
          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
            <span className="font-mono text-muted-foreground">Gold SLA 99.5%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewDoc(documents[4])}
              className="h-6 px-2 text-[10px] text-primary hover:text-primary gap-1"
            >
              <Eye className="h-3 w-3" />
              <span>Preview</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* 3. Document Repository & Explorer Table */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs space-y-0">
        {/* Table Toolbar */}
        <div className="p-3.5 border-b border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
              Tenant Documents Vault ({filteredDocs.length})
            </h4>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/60 text-[10px]">
              {(["ALL", "LEGAL", "TECHNICAL", "COMPLIANCE", "BILLING"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-2 py-1 rounded-md font-medium transition-colors",
                    selectedCategory === cat
                      ? "bg-card text-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berkas..."
                className="h-7 text-xs pl-7 w-36 sm:w-44 bg-card border-border"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-foreground">Nama Berkas</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">Kategori</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">Ukuran</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">Diupload Oleh</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">Tanggal</TableHead>
              <TableHead className="text-xs font-semibold text-foreground">Status</TableHead>
              <TableHead className="text-xs font-semibold text-foreground text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                  Tidak ada dokumen yang ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((doc) => (
                <TableRow key={doc.id} className="border-border hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-xs text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded bg-muted/60 border border-border flex items-center justify-center text-muted-foreground shrink-0">
                        {doc.format === "PDF" ? <FileText className="h-3.5 w-3.5 text-red-500" /> : <FileCode className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold block truncate max-w-xs">{doc.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono truncate block max-w-xs">
                          s3://tenant-assets/tenants/{org.slug}/documents/{doc.category.toLowerCase()}/
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border text-[9px] font-mono">
                      {doc.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {formatFileSize(doc.sizeBytes)}
                  </TableCell>
                  <TableCell className="text-xs text-foreground">
                    {doc.uploadedBy}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {doc.uploadedAt}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-mono text-[9px]",
                        doc.status === "VERIFIED" && "border-primary/30 bg-primary/10 text-primary",
                        doc.status === "ACTIVE" && "border-blue-500/30 bg-blue-500/10 text-blue-500",
                        doc.status === "PENDING_REVIEW" && "border-amber-500/30 bg-amber-500/10 text-amber-500"
                      )}
                    >
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ActionTooltip label="Preview Dokumen">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewDoc(doc)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </ActionTooltip>
                      <ActionTooltip label="Download Berkas">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(doc)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </ActionTooltip>
                      <ActionTooltip label="Hapus Dokumen">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc.id, doc.name)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </ActionTooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 4. Upload Document Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md bg-popover/95 backdrop-blur-xl border-border text-foreground rounded-2xl shadow-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider font-bold">
              <Upload className="h-4 w-4" />
              <span>MinIO S3 Document Vault</span>
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Unggah Dokumen Tenant
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Unggah dokumen legalitas atau berkas teknis khusus untuk organisasi <strong className="text-foreground">{org.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Nama Dokumen</Label>
              <Input
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="Contoh: MoU-Kerjasama-2026.pdf"
                className="h-9 text-xs bg-card border-border text-foreground"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Kategori Dokumen</Label>
              <Select
                value={newDocCategory}
                onValueChange={(v) => setNewDocCategory(v as DocumentCategory)}
              >
                <SelectTrigger className="h-9 text-xs bg-card border-border text-foreground">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-xs">
                  <SelectItem value="LEGAL">LEGAL — MoU & Kontrak B2B</SelectItem>
                  <SelectItem value="TECHNICAL">TECHNICAL — BAST & Topologi BRAS</SelectItem>
                  <SelectItem value="COMPLIANCE">COMPLIANCE — NIB / NPWP / Izin ISP</SelectItem>
                  <SelectItem value="BILLING">BILLING — Bukti Pembayaran / Faktur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Pilih Berkas (PDF / ZIP / KMZ)</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-4 text-center bg-card/40 hover:bg-card/70 transition-colors cursor-pointer">
                <input
                  type="file"
                  id="doc-file-upload"
                  onChange={(e) => setNewDocFile(e.target.files?.[0] || null)}
                  className="hidden"
                  accept=".pdf,.zip,.kmz,.kml,.json"
                />
                <label htmlFor="doc-file-upload" className="cursor-pointer block space-y-1.5">
                  <FileText className="h-6 w-6 text-muted-foreground mx-auto" />
                  <span className="text-xs font-medium text-foreground block">
                    {newDocFile ? newDocFile.name : "Klik untuk memilih berkas dari komputer"}
                  </span>
                  <span className="text-[10px] text-muted-foreground block font-mono">
                    Maksimum ukuran berkas: 25 MB
                  </span>
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsUploadOpen(false)}
                className="h-8 text-xs border-border"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={uploading}
                className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
              >
                {uploading ? "Mengunggah..." : "Simpan Dokumen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Document Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-2xl bg-popover/95 backdrop-blur-2xl border-border text-foreground rounded-2xl shadow-2xl p-6 max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase font-bold">
                <FileText className="h-4 w-4" />
                <span>Dokumen Preview</span>
              </div>
              <Badge variant="outline" className="border-border text-[10px] font-mono">
                {previewDoc?.format}
              </Badge>
            </div>
            <DialogTitle className="text-base font-bold text-foreground truncate">
              {previewDoc?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 my-3 p-8 border border-border rounded-xl bg-card/60 flex flex-col items-center justify-center gap-3 text-center min-h-[260px]">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
              <FileCheck className="h-7 w-7" />
            </div>
            <div className="space-y-1 max-w-sm">
              <span className="text-sm font-bold text-foreground block">
                {previewDoc?.name}
              </span>
              <p className="text-xs text-muted-foreground">
                Berkas tersimpan aman di MinIO Object Storage bucket <code className="text-primary font-mono">tenant-assets</code> (Private SSE-S3).
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2 text-xs font-mono text-muted-foreground">
              <span>Ukuran: {previewDoc ? formatFileSize(previewDoc.sizeBytes) : "0 KB"}</span>
              <span>•</span>
              <span>Status: {previewDoc?.status}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewDoc(null)}
              className="h-8 text-xs border-border"
            >
              Tutup
            </Button>
            <Button
              size="sm"
              onClick={() => previewDoc && handleDownload(previewDoc)}
              className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh Berkas</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
