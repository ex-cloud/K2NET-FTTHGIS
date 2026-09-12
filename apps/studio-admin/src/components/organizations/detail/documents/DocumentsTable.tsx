import {
  Badge,
  Button,
  Input,
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
  Download,
  Eye,
  Trash2,
  FileCode,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type TenantDocument, formatFileSize } from "./types";

interface DocumentsTableProps {
  slug: string;
  filteredDocs: TenantDocument[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onPreview: (doc: TenantDocument) => void;
  onDownload: (doc: TenantDocument) => void;
  onDelete: (id: string, name: string) => void;
}

const CATEGORIES = ["ALL", "LEGAL", "TECHNICAL", "COMPLIANCE", "BILLING"] as const;

export function DocumentsTable({
  slug,
  filteredDocs,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onPreview,
  onDownload,
  onDelete,
}: DocumentsTableProps) {
  return (
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
            {CATEGORIES.map((cat) => (
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
                      {doc.format === "PDF" ? (
                        <FileText className="h-3.5 w-3.5 text-red-500" />
                      ) : (
                        <FileCode className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold block truncate max-w-xs">{doc.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono truncate block max-w-xs">
                        s3://tenant-assets/tenants/{slug}/documents/{doc.category.toLowerCase()}/
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
                        onClick={() => onPreview(doc)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </ActionTooltip>
                    <ActionTooltip label="Download Berkas">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDownload(doc)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </ActionTooltip>
                    <ActionTooltip label="Hapus Dokumen">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(doc.id, doc.name)}
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
  );
}
