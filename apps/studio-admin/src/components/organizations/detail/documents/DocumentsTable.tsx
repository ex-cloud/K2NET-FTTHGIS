import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@k2net/ui";
import { type TenantDocument, type DocumentStatus } from "./types";
import type { EnrichedOrganization } from "../../types";
import { DocumentsTableToolbar } from "./DocumentsTableToolbar";
import { DocumentsTableRowItem } from "./DocumentsTableRowItem";

interface DocumentsTableProps {
  org: EnrichedOrganization;
  slug: string;
  filteredDocs: TenantDocument[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  onPreview: (doc: TenantDocument) => void;
  onDownload: (doc: TenantDocument) => void;
  onDelete: (id: string, name: string) => void;
  onUpdateStatus: (docId: string, status: DocumentStatus, notes?: string) => void;
}

export function DocumentsTable({
  org,
  slug,
  filteredDocs,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  statusFilter,
  setStatusFilter,
  onPreview,
  onDownload,
  onDelete,
  onUpdateStatus,
}: DocumentsTableProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs space-y-0">
      <DocumentsTableToolbar
        totalCount={filteredDocs.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

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
                Tidak ada dokumen yang ditemukan sesuai filter.
              </TableCell>
            </TableRow>
          ) : (
            filteredDocs.map((doc) => (
              <DocumentsTableRowItem
                key={doc.id}
                doc={doc}
                org={org}
                slug={slug}
                onPreview={onPreview}
                onDownload={onDownload}
                onDelete={onDelete}
                onUpdateStatus={onUpdateStatus}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
